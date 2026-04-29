import json
import logging

from flask import Blueprint, jsonify, request

from app.services.weather_service import WeatherService

logger = logging.getLogger(__name__)
weather_bp = Blueprint("weather", __name__, url_prefix="/api/weather")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


def err(error="error", message="Request failed", status=400):
    return jsonify({"success": False, "error": error, "message": message}), status


# -----------------------------------------------------------------------
# Public forecast endpoint — NO authentication required
# -----------------------------------------------------------------------
@weather_bp.get("/forecast")
def forecast():
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    if not lat or not lon:
        return err("MISSING_PARAMS", "lat and lon query parameters are required", 400)

    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (TypeError, ValueError):
        return err("INVALID_PARAMS", "lat and lon must be numeric values", 400)

    result = WeatherService.get_forecast(lat_f, lon_f)
    if result is None:
        return err("WEATHER_SERVICE_ERROR", "Unable to retrieve weather forecast. Try again later.", 503)

    return ok(result, "Forecast retrieved successfully")


# -----------------------------------------------------------------------
# Authenticated endpoints
# -----------------------------------------------------------------------
@weather_bp.get("/planting-window")
def planting_window():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return err("MISSING_PARAMS", "lat and lon are required", 400)
    try:
        result = WeatherService.get_forecast(float(lat), float(lon))
        if result is None:
            return err("WEATHER_SERVICE_ERROR", "Unable to retrieve forecast", 503)
        forecast_days = result.get("forecast", [])
        has_window, days = WeatherService.check_planting_window(forecast_days)
        return ok({"has_window": has_window, "days": days})
    except Exception as e:
        logger.exception("planting-window error")
        return err("SERVER_ERROR", str(e), 500)


@weather_bp.get("/disease-risk")
def disease_risk():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return err("MISSING_PARAMS", "lat and lon are required", 400)
    try:
        result = WeatherService.get_forecast(float(lat), float(lon))
        if result is None:
            return err("WEATHER_SERVICE_ERROR", "Unable to retrieve forecast", 503)
        forecast_days = result.get("forecast", [])
        today = forecast_days[0] if forecast_days else {}
        risk = WeatherService.calculate_disease_risk(
            today.get("temp_max"), today.get("temp_min"), today.get("humidity_percent"), None
        )
        return ok({"disease_risk": risk, "date": today.get("date")})
    except Exception as e:
        logger.exception("disease-risk error")
        return err("SERVER_ERROR", str(e), 500)


@weather_bp.get("/seasonal")
def seasonal():
    return ok({"message": "Expect showers in most highland counties over the next 2 weeks."})


@weather_bp.get("/historical")
def historical():
    try:
        lat = float(request.args.get("lat", 0))
        lon = float(request.args.get("lon", 0))
        crop = request.args.get("crop")
        data = WeatherService.get_historical_rainfall(lat, lon, crop)
        return ok(data)
    except Exception as e:
        logger.exception("historical error")
        return err("SERVER_ERROR", str(e), 500)
