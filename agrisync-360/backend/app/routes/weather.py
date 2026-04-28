from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.crop import Crop
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.services.weather_service import WeatherService

weather_bp = Blueprint("weather", __name__, url_prefix="/api/weather")


def rsp(data=None, message="Success", status=200):
    from flask import jsonify
    return jsonify({"success": True, "data": data or {}, "message": message}), status


@weather_bp.get("/forecast")
@jwt_required()
def forecast():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first_or_404()
        farm = farmer.farms.filter_by(is_primary=True, is_deleted=False).first() or farmer.farms.first()
        lat, lon = farm.get_coordinates()
    return rsp(WeatherService.get_forecast(float(lat), float(lon)))


@weather_bp.get("/planting-window")
@jwt_required()
def planting_window():
    data = forecast()[0].json["data"]
    has_window, days = WeatherService.check_planting_window(data)
    return rsp({"has_window": has_window, "days": days})


@weather_bp.get("/disease-risk")
@jwt_required()
def disease_risk():
    farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first_or_404()
    crops = Crop.query.join(Farm, Crop.farm_id == Farm.id).filter(Farm.farmer_id == farmer.id, Crop.is_active.is_(True)).all()
    fdata = forecast()[0].json["data"]
    today = fdata[0] if fdata else {}
    out = [{"crop": c.crop_name, "risk": WeatherService.calculate_disease_risk(today.get("temperature_max"), today.get("temperature_min"), today.get("humidity_percent"), c.crop_name)} for c in crops]
    return rsp(out)


@weather_bp.get("/seasonal")
@jwt_required()
def seasonal():
    return rsp({"message": "Expect showers in most highland counties over the next 2 weeks."})


@weather_bp.get("/historical")
@jwt_required()
def historical():
    return rsp(WeatherService.get_historical_rainfall(float(request.args.get("lat")), float(request.args.get("lon")), request.args.get("crop")))
