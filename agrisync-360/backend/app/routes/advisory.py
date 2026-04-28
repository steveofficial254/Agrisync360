from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.advisory import Advisory
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.services.advisory_service import AdvisoryService
from app.utils.decorators import admin_required

advisory_bp = Blueprint("advisory", __name__, url_prefix="/api/advisory")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


@advisory_bp.get("/crop/<crop_name>")
@jwt_required()
def crop_advisory(crop_name):
    county = request.args.get("county")
    growth_stage = request.args.get("growth_stage")
    return ok(AdvisoryService.get_crop_advisory(crop_name, county, growth_stage))

@advisory_bp.get("/calendar/<crop_name>")
@jwt_required()
def calendar(crop_name):
    return ok(AdvisoryService.get_planting_calendar(crop_name, date.today(), request.args.get("county")))

@advisory_bp.get("/nutrition/<crop_name>")
@jwt_required()
def nutrition(crop_name):
    return ok(AdvisoryService.get_nutrition_guide(crop_name, request.args.get("growth_stage")))

@advisory_bp.get("/pests/<crop_name>")
@jwt_required()
def pests(crop_name):
    return ok(AdvisoryService.get_disease_alert(crop_name, request.args.get("risk", "medium"), request.args.get("county")))

@advisory_bp.get("/my-crops")
@jwt_required()
def my_crops():
    farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first_or_404()
    crops = Crop.query.join(Farm).filter(Farm.farmer_id == farmer.id, Crop.is_active.is_(True)).all()
    data = [AdvisoryService.get_crop_advisory(c.crop_name, farmer.county, c.growth_stage) for c in crops]
    return ok(data)

@advisory_bp.post("/")
@jwt_required()
@admin_required
def create_advisory():
    adv = Advisory(**(request.get_json() or {}))
    adv.created_by = get_jwt_identity()
    from app.extensions import db
    db.session.add(adv); db.session.commit()
    return ok(adv.to_dict(), "Advisory created", 201)

@advisory_bp.put("/<adv_id>")
@jwt_required()
@admin_required
def update_advisory(adv_id):
    adv = Advisory.query.get_or_404(adv_id)
    for k,v in (request.get_json() or {}).items():
        if hasattr(adv,k): setattr(adv,k,v)
    from app.extensions import db
    db.session.commit()
    return ok(adv.to_dict(), "Advisory updated")

@advisory_bp.delete("/<adv_id>")
@jwt_required()
@admin_required
def delete_advisory(adv_id):
    adv = Advisory.query.get_or_404(adv_id)
    adv.is_active = False
    from app.extensions import db
    db.session.commit()
    return ok({}, "Advisory deleted")

@advisory_bp.get("/")
@jwt_required()
@admin_required
def list_advisory():
    return ok([a.to_dict() for a in Advisory.query.order_by(Advisory.created_at.desc()).all()])
