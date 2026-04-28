import json
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

import requests

from app.extensions import db, redis_client
from app.models.weather import Weather


class WeatherService:
    @staticmethod
    def get_forecast(lat, lon):
        key = f"weather:{round(float(lat), 3)}:{round(float(lon), 3)}"
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)

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
                    "uv_index_max",
                    "weathercode",
                ],
                "timezone": "Africa/Nairobi",
                "forecast_days": 7,
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json().get("daily", {})
        records = []
        for idx, day in enumerate(payload.get("time", [])):
            tmax = payload.get("temperature_2m_max", [None])[idx]
            tmin = payload.get("temperature_2m_min", [None])[idx]
            hum = payload.get("relativehumidity_2m_max", [None])[idx]
            rain = payload.get("precipitation_sum", [0])[idx]
            w = Weather(
                latitude=float(lat),
                longitude=float(lon),
                forecast_date=datetime.strptime(day, "%Y-%m-%d").date(),
                temperature_max=tmax,
                temperature_min=tmin,
                precipitation_mm=rain,
                humidity_percent=hum,
                wind_speed_kmh=payload.get("windspeed_10m_max", [None])[idx],
                uv_index=payload.get("uv_index_max", [None])[idx],
                weather_code=payload.get("weathercode", [None])[idx],
                weather_description=f"WMO-{payload.get('weathercode', [None])[idx]}",
                disease_risk_level=WeatherService.calculate_disease_risk(tmax, tmin, hum, None),
                frost_risk=WeatherService.check_frost_risk(tmin),
                planting_window=False,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=6),
            )
            db.session.add(w)
            records.append(w.to_dict())
        db.session.commit()

        has_window, window_days = WeatherService.check_planting_window(records)
        for row in records:
            row["planting_window"] = has_window and row["forecast_date"] in window_days

        redis_client.setex(key, 21600, json.dumps(records, default=str))
        return records

    @staticmethod
    def calculate_disease_risk(temp_max, temp_min, humidity, crop):
        _ = crop
        if humidity is None:
            return "medium"
        if humidity > 90:
            return "very_high"
        if humidity > 80 and temp_max is not None and temp_min is not None and 18 <= ((temp_max + temp_min) / 2) <= 25:
            return "high"
        if humidity < 60:
            return "low"
        return "medium"

    @staticmethod
    def check_planting_window(forecast_days):
        days = [d["forecast_date"] for d in forecast_days if (d.get("precipitation_mm") or 0) > 10]
        streak = []
        for d in days:
            if not streak:
                streak = [d]
                continue
            prev = datetime.strptime(streak[-1], "%Y-%m-%d").date() if isinstance(streak[-1], str) else date.fromisoformat(streak[-1])
            cur = datetime.strptime(d, "%Y-%m-%d").date() if isinstance(d, str) else date.fromisoformat(d)
            if (cur - prev).days == 1:
                streak.append(d)
                if len(streak) >= 3:
                    return True, streak
            else:
                streak = [d]
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
        return {"monthly_averages": averages, "recommended_planting_months": [m for m, _ in best_months]}
