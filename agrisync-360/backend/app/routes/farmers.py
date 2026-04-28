from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.farmer import Farmer
from app.models.user import User
from app.utils.decorators import admin_required

farmers_bp = Blueprint("farmers", __name__, url_prefix="/api/farmers")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


@farmers_bp.get("/profile")
@jwt_required()
def get_profile():
    farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
    if not farmer:
        return jsonify({"success": False, "error": "not_found", "message": "Profile not found"}), 404
    return ok(farmer.to_dict())


@farmers_bp.put("/profile")
@jwt_required()
def update_profile():
    farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
    if not farmer:
        return jsonify({"success": False, "error": "not_found", "message": "Profile not found"}), 404
    payload = request.get_json() or {}
    for f in ["first_name", "last_name", "county", "sub_county", "ward", "village"]:
        if f in payload:
            setattr(farmer, f, payload[f])
    db.session.commit()
    return ok(farmer.to_dict(), "Profile updated")


@farmers_bp.get("/<farmer_id>")
@jwt_required()
@admin_required
def get_farmer(farmer_id):
    farmer = Farmer.query.get_or_404(farmer_id)
    return ok(farmer.to_dict())


@farmers_bp.get("/")
@jwt_required()
@admin_required
def list_farmers():
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)
    pg = Farmer.query.paginate(page=page, per_page=per_page, error_out=False)
    return ok({"items": [f.to_dict() for f in pg.items], "total": pg.total, "page": page, "per_page": per_page})
