import json
import logging
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

import requests

from app.extensions import db, redis_client
from app.models.weather import Weather
from app.services.external_data_service import ExternalDataService

logger = logging.getLogger(__name__)

WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Icy fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    80: "Slight showers",
    81: "Moderate showers",
    82: "Violent showers",
    95: "Thunderstorm",
    99: "Thunderstorm with hail",
}


class WeatherService:
    @staticmethod
    def get_forecast(lat: float, lon: float):
        """
        Fetch 7-day forecast. Try OpenWeatherMap first, fallback to Open-Meteo.
        Caches in Redis for 6 hours. Returns None on all failures.
        """
        cache_key = f"weather:{round(lat, 3)}:{round(lon, 3)}"

        # Try Redis cache first
        try:
            cached = redis_client.get(cache_key)
            if cached:
                logger.debug("Weather cache HIT for %s", cache_key)
                return json.loads(cached)
        except Exception as redis_err:
            logger.warning("Redis unavailable, skipping cache read: %s", redis_err)

        # Try OpenWeatherMap first (more detailed data)
        try:
            forecast_data = ExternalDataService.get_weather_forecast(lat, lon, 7)
            if forecast_data:
                # Cache the result
                try:
                    redis_client.setex(cache_key, 21600, json.dumps(forecast_data))  # 6 hours
                except Exception as cache_err:
                    logger.warning("Failed to cache weather data: %s", cache_err)
                
                return forecast_data
        except Exception as owm_err:
            logger.warning("OpenWeatherMap failed, trying Open-Meteo: %s", owm_err)

        # Fallback to Open-Meteo (existing logic)
        try:
            response = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "forecast_days": 7,
                },
                timeout=20,
            )
            response.raise_for_status()
        except Exception as api_err:
            logger.error("Open-Meteo API error: %s", api_err)
            if hasattr(api_err, 'response') and api_err.response is not None:
                logger.error("API Response Status: %s", api_err.response.status_code)
                logger.error("API Response Text: %s", api_err.response.text)
            return None  # Caller returns 503

        payload = response.json().get("daily", {})
        forecast_list = []

        for idx, day_str in enumerate(payload.get("time", [])):
            tmax = payload.get("temperature_2m_max", [None] * 7)[idx]
            tmin = payload.get("temperature_2m_min", [None] * 7)[idx]
            rain = payload.get("precipitation_sum", [0] * 7)[idx] or 0
            hum = None  # Not available in simplified API
            wind = None  # Not available in simplified API
            wcode = 0  # Default to clear weather

            # Convert Open-Meteo format to our format
            forecast_list.append({
                "date": day_str,
                "temperature_max": tmax,
                "temperature_min": tmin,
                "humidity": hum,
                "precipitation_mm": rain,
                "wind_speed": wind,
                "weather_code": wcode,
                "description": "forecast",
                "disease_risk": "low",  # Default
                "planting_window_available": rain > 2 and 15 <= tmax <= 30
            })

        # Cache the Open-Meteo result
        try:
            redis_client.setex(cache_key, 21600, json.dumps(forecast_list))
        except Exception as cache_err:
            logger.warning("Failed to cache Open-Meteo weather data: %s", cache_err)

        return forecast_list

    @staticmethod
    def get_current_weather(lat: float, lon: float):
        """
        Fetch current weather from OpenWeatherMap
        """
        try:
            return ExternalDataService.get_weather_data(lat, lon)
        except Exception as e:
            logger.error("Current weather fetch failed: %s", e)
            return None

    @staticmethod
    def calculate_disease_risk(temp_max, temp_min, humidity, crop):
        """
        Determine disease risk level based on humidity and temperature.
        humidity > 90%               → very_high
        humidity > 80% & temp 18-25° → high
        humidity < 60%               → low
        else                         → medium
        """
        _ = crop
        if humidity is None:
            return "medium"
        if humidity > 90:
            return "very_high"
        if humidity > 80 and temp_max is not None and temp_min is not None:
            avg_temp = (temp_max + temp_min) / 2
            if 18 <= avg_temp <= 25:
                return "high"
        if humidity < 60:
            return "low"
        return "medium"

    @staticmethod
    def check_planting_window(forecast_days):
        """
        Returns (True, [day_strings]) if there are 3+ consecutive days
        with precipitation > 10mm, else (False, []).
        """
        # forecast_days is list of dicts with keys 'date' and 'precipitation_mm'
        rainy_days = [d["date"] for d in forecast_days if (d.get("precipitation_mm") or 0) > 10]

        streak = []
        for d_str in rainy_days:
            if not streak:
                streak = [d_str]
                continue
            prev = datetime.strptime(streak[-1], "%Y-%m-%d").date()
            cur = datetime.strptime(d_str, "%Y-%m-%d").date()
            if (cur - prev).days == 1:
                streak.append(d_str)
                if len(streak) >= 3:
                    return True, streak
            else:
                streak = [d_str]
        return False, []

    @staticmethod
    def check_frost_risk(temp_min):
        return temp_min is not None and temp_min < 4

    @staticmethod
    def get_historical_rainfall(lat, lon, crop):
        _ = crop
        today = datetime.now().strftime("%Y%m%d")
        response = requests.get(
            "https://power.larc.nasa.gov/api/temporal/daily/point",
            params={
                "parameters": "PRECTOTCORR",
                "community": "AG",
                "longitude": lon,
                "latitude": lat,
                "start": "20200101",
                "end": today,
                "format": "JSON",
            },
            timeout=30,
        )
        response.raise_for_status()
        vals = response.json().get("properties", {}).get("parameter", {}).get("PRECTOTCORR", {})
        monthly = defaultdict(list)
        for ymd, mm in vals.items():
            if mm is None or mm < 0:
                continue
            month = ymd[4:6]
            monthly[month].append(mm)
        averages = {m: round(sum(v) / len(v), 2) for m, v in monthly.items() if v}
        best_months = sorted(averages.items(), key=lambda x: x[1], reverse=True)[:3]
        return {
            "monthly_averages": averages,
            "recommended_planting_months": [m for m, _ in best_months],
        }
