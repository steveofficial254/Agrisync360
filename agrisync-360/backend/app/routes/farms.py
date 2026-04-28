from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.farmer import Farmer

farms_bp = Blueprint("farms", __name__, url_prefix="/api/farms")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


def my_farmer():
    return Farmer.query.filter_by(user_id=get_jwt_identity()).first()


@farms_bp.post("/")
@jwt_required()
def create_farm():
    farmer = my_farmer()
    payload = request.get_json() or {}
    farm = Farm(
        farmer_id=farmer.id,
        name=payload["name"],
        location=Farm.build_point(float(payload["latitude"]), float(payload["longitude"])),
        county=payload["county"],
        sub_county=payload.get("sub_county"),
        size_acres=float(payload["size_acres"]),
        soil_type=payload["soil_type"],
        water_source=payload["water_source"],
        elevation_meters=payload.get("elevation_meters"),
        is_primary=bool(payload.get("is_primary", False)),
    )
    db.session.add(farm)
    db.session.commit()
    return ok(farm.to_dict(), "Farm created", 201)


@farms_bp.get("/")
@jwt_required()
def list_farms():
    farmer = my_farmer()
    farms = farmer.farms.filter_by(is_deleted=False).all()
    return ok([f.to_dict() for f in farms])


@farms_bp.get("/<farm_id>")
@jwt_required()
def get_farm(farm_id):
    farm = Farm.query.get_or_404(farm_id)
    return ok(farm.to_dict())


@farms_bp.put("/<farm_id>")
@jwt_required()
def update_farm(farm_id):
    farm = Farm.query.get_or_404(farm_id)
    payload = request.get_json() or {}
    for f in ["name", "county", "sub_county", "size_acres", "soil_type", "water_source", "elevation_meters", "is_primary"]:
        if f in payload:
            setattr(farm, f, payload[f])
    if "latitude" in payload and "longitude" in payload:
        farm.location = Farm.build_point(float(payload["latitude"]), float(payload["longitude"]))
    db.session.commit()
    return ok(farm.to_dict(), "Farm updated")


@farms_bp.delete("/<farm_id>")
@jwt_required()
def delete_farm(farm_id):
    farm = Farm.query.get_or_404(farm_id)
    farm.is_deleted = True
    db.session.commit()
    return ok({}, "Farm deleted")


@farms_bp.post("/<farm_id>/crops")
@jwt_required()
def add_crop(farm_id):
    payload = request.get_json() or {}
    crop = Crop(farm_id=farm_id, **payload)
    db.session.add(crop)
    db.session.commit()
    return ok(crop.to_dict(), "Crop added", 201)


@farms_bp.get("/<farm_id>/crops")
@jwt_required()
def list_crops(farm_id):
    return ok([c.to_dict() for c in Crop.query.filter_by(farm_id=farm_id).all()])


@farms_bp.put("/<farm_id>/crops/<crop_id>")
@jwt_required()
def update_crop(farm_id, crop_id):
    crop = Crop.query.filter_by(id=crop_id, farm_id=farm_id).first_or_404()
    payload = request.get_json() or {}
    for k, v in payload.items():
        if hasattr(crop, k):
            setattr(crop, k, v)
    db.session.commit()
    return ok(crop.to_dict(), "Crop updated")


@farms_bp.delete("/<farm_id>/crops/<crop_id>")
@jwt_required()
def remove_crop(farm_id, crop_id):
    crop = Crop.query.filter_by(id=crop_id, farm_id=farm_id).first_or_404()
    db.session.delete(crop)
    db.session.commit()
    return ok({}, "Crop removed")
