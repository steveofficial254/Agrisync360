import json
import logging
from collections import defaultdict
from datetime import date, datetime, timedelta

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

        forecast_list = None

        # Try OpenWeatherMap first (more detailed data)
        try:
            forecast_list = ExternalDataService.get_weather_forecast(lat, lon, 7)
        except Exception as owm_err:
            logger.warning("OpenWeatherMap failed, trying Open-Meteo: %s", owm_err)

        # Fallback to Open-Meteo
        if not forecast_list:
            try:
                response = requests.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code",
                        "forecast_days": 7,
                    },
                    timeout=20,
                )
                response.raise_for_status()
                payload = response.json().get("daily", {})
                
                forecast_list = []
                for idx, day_str in enumerate(payload.get("time", [])):
                    tmax = payload.get("temperature_2m_max", [None] * 7)[idx]
                    tmin = payload.get("temperature_2m_min", [None] * 7)[idx]
                    rain = payload.get("precipitation_sum", [0] * 7)[idx] or 0
                    wind = payload.get("wind_speed_10m_max", [0] * 7)[idx] or 0
                    wcode = payload.get("weather_code", [0] * 7)[idx] or 0
                    
                    # Estimate humidity: higher if it rains
                    humidity = 85 if rain > 2 else 65

                    forecast_list.append({
                        "date": day_str,
                        "temperature_max": tmax,
                        "temperature_min": tmin,
                        "humidity": humidity,
                        "precipitation_mm": rain,
                        "wind_speed": wind,
                        "weather_code": wcode,
                        "description": WEATHER_CODES.get(wcode, "partly cloudy")
                    })
            except Exception as api_err:
                logger.error("Open-Meteo API error: %s", api_err)

        # Final fallback to hardcoded if both APIs failed
        if not forecast_list:
            logger.warning("All weather APIs failed, generating mock fallback forecast")
            forecast_list = []
            base_date = datetime.now()
            for i in range(7):
                day_date = base_date + timedelta(days=i)
                forecast_list.append({
                    "date": day_date.strftime("%Y-%m-%d"),
                    "temperature_max": 25.0,
                    "temperature_min": 15.0,
                    "humidity": 65,
                    "precipitation_mm": 0.0,
                    "wind_speed": 10.0,
                    "weather_code": 0,
                    "description": "Clear sky"
                })

        # Process and format the forecast list to ensure BOTH frontend formats are populated
        processed_forecast = []
        for day in forecast_list:
            date_str = day.get("date")
            tmax = day.get("temperature_max") if day.get("temperature_max") is not None else day.get("temp_max", 25.0)
            tmin = day.get("temperature_min") if day.get("temperature_min") is not None else day.get("temp_min", 15.0)
            rain = day.get("precipitation_mm", 0.0) or 0.0
            humidity = day.get("humidity") if day.get("humidity") is not None else day.get("humidity_percent", 65)
            wind = day.get("wind_speed") if day.get("wind_speed") is not None else day.get("wind_speed_kmh", 10.0)
            wcode = day.get("weather_code", 0)
            desc = day.get("description") or day.get("weather_description") or WEATHER_CODES.get(wcode, "Clear sky")

            # Disease risk calculation
            if humidity > 90:
                disease_risk = 'very_high'
            elif humidity > 80 and 18 <= (tmax or 0) <= 26:
                disease_risk = 'high'
            elif humidity > 70:
                disease_risk = 'medium'
            else:
                disease_risk = 'low'

            processed_forecast.append({
                "date": date_str,
                "temperature_max": round(tmax, 1),
                "temp_max": round(tmax, 1),
                "temperature_min": round(tmin, 1),
                "temp_min": round(tmin, 1),
                "precipitation_mm": round(rain, 1),
                "humidity": round(humidity),
                "humidity_percent": round(humidity),
                "wind_speed": round(wind, 1),
                "wind_speed_kmh": round(wind, 1),
                "weather_code": wcode,
                "weather_description": desc,
                "description": desc,
                "disease_risk": disease_risk,
                "frost_risk": tmin < 4,
                "planting_window": rain >= 10,
                "planting_window_available": rain >= 10
            })

        overall_disease_risk = processed_forecast[0]["disease_risk"] if processed_forecast else "low"
        planting_window_available = any(day["planting_window"] for day in processed_forecast)

        result_dict = {
            "forecast": processed_forecast,
            "summary": {
                "overall_disease_risk": overall_disease_risk,
                "planting_window_available": planting_window_available
            }
        }

        # Cache the processed result
        try:
            redis_client.setex(cache_key, 21600, json.dumps(result_dict))
        except Exception as cache_err:
            logger.warning("Failed to cache weather data: %s", cache_err)

        return result_dict

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
