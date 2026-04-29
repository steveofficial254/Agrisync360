import json
import logging
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

import requests

from app.extensions import db, redis_client
from app.models.weather import Weather

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
        Fetch 7-day forecast from Open-Meteo. Caches in Redis for 6 hours.
        Returns None on Open-Meteo failure (caller should return 503).
        """
        cache_key = f"weather:{round(lat, 3)}:{round(lon, 3)}"

        # Try Redis cache first (skip silently if Redis is down)
        try:
            cached = redis_client.get(cache_key)
            if cached:
                logger.debug("Weather cache HIT for %s", cache_key)
                return json.loads(cached)
        except Exception as redis_err:
            logger.warning("Redis unavailable, skipping cache read: %s", redis_err)

        # Fetch from Open-Meteo
        try:
            response = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": [
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "precipitation_sum",
                        "windspeed_10m_max",
                        "relativehumidity_2m_max",
                        "weathercode",
                    ],
                    "timezone": "Africa/Nairobi",
                    "forecast_days": 7,
                },
                timeout=20,
            )
            response.raise_for_status()
        except Exception as api_err:
            logger.error("Open-Meteo API error: %s", api_err)
            return None  # Caller returns 503

        payload = response.json().get("daily", {})
        forecast_list = []

        for idx, day_str in enumerate(payload.get("time", [])):
            tmax = payload.get("temperature_2m_max", [None] * 7)[idx]
            tmin = payload.get("temperature_2m_min", [None] * 7)[idx]
            hum = payload.get("relativehumidity_2m_max", [None] * 7)[idx]
            rain = payload.get("precipitation_sum", [0] * 7)[idx] or 0
            wind = payload.get("windspeed_10m_max", [None] * 7)[idx]
            wcode = payload.get("weathercode", [None] * 7)[idx]

            disease_risk = WeatherService.calculate_disease_risk(tmax, tmin, hum, None)
            frost_risk = WeatherService.check_frost_risk(tmin)

            day_record = {
                "date": day_str,
                "temp_max": tmax,
                "temp_min": tmin,
                "precipitation_mm": rain,
                "humidity_percent": hum,
                "wind_speed_kmh": wind,
                "weather_code": wcode,
                "weather_description": WEATHER_CODES.get(wcode, f"WMO-{wcode}"),
                "disease_risk": disease_risk,
                "frost_risk": frost_risk,
                "planting_window": False,  # Updated below
            }
            forecast_list.append(day_record)

            # Persist to DB (best-effort, don't fail on DB error)
            try:
                w = Weather(
                    latitude=lat,
                    longitude=lon,
                    forecast_date=datetime.strptime(day_str, "%Y-%m-%d").date(),
                    temperature_max=tmax,
                    temperature_min=tmin,
                    precipitation_mm=rain,
                    humidity_percent=hum,
                    wind_speed_kmh=wind,
                    weather_code=wcode,
                    weather_description=WEATHER_CODES.get(wcode, f"WMO-{wcode}"),
                    disease_risk_level=disease_risk,
                    frost_risk=frost_risk,
                    planting_window=False,
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=6),
                )
                db.session.add(w)
            except Exception as db_err:
                logger.warning("Could not persist weather record: %s", db_err)

        try:
            db.session.commit()
        except Exception as commit_err:
            db.session.rollback()
            logger.warning("Weather DB commit failed: %s", commit_err)

        # Calculate planting windows and mark days
        has_window, window_days = WeatherService.check_planting_window(forecast_list)
        window_day_set = set(window_days)
        frost_risk_days = []
        overall_risks = []

        for row in forecast_list:
            row["planting_window"] = row["date"] in window_day_set
            if row["frost_risk"]:
                frost_risk_days.append(row["date"])
            overall_risks.append(row["disease_risk"])

        # Compute overall disease risk (worst level wins)
        risk_order = {"very_high": 4, "high": 3, "medium": 2, "low": 1}
        overall_disease_risk = max(overall_risks, key=lambda r: risk_order.get(r, 0)) if overall_risks else "medium"

        result = {
            "location": {
                "latitude": lat,
                "longitude": lon,
                "timezone": "Africa/Nairobi",
            },
            "forecast": forecast_list,
            "summary": {
                "planting_window_available": has_window,
                "planting_window_days": list(window_days) if has_window else [],
                "overall_disease_risk": overall_disease_risk,
                "frost_risk_days": frost_risk_days,
            },
        }

        # Cache in Redis — skip silently if Redis is down
        try:
            redis_client.setex(cache_key, 21600, json.dumps(result, default=str))
            logger.debug("Weather cached under key %s", cache_key)
        except Exception as redis_err:
            logger.warning("Redis unavailable, skipping cache write: %s", redis_err)

        return result

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
