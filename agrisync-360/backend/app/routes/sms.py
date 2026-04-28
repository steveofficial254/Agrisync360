from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.models.sms import SMS
from app.services.sms_service import SMSService
from app.utils.decorators import admin_required

sms_bp = Blueprint("sms", __name__, url_prefix="/api/sms")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status

@sms_bp.post("/send-bulk")
@jwt_required()
@admin_required
def send_bulk():
    p = request.get_json() or {}
    return ok(SMSService().send_bulk_sms(p.get("phone_numbers", []), p.get("message", ""), p.get("message_type", "bulk")), "Bulk SMS queued")

@sms_bp.post("/send-individual")
@jwt_required()
@admin_required
def send_individual():
    p = request.get_json() or {}
    return ok(SMSService().send_sms(p.get("phone_number"), p.get("message"), message_type=p.get("message_type", "bulk")))

@sms_bp.get("/logs")
@jwt_required()
@admin_required
def logs():
    rows = SMS.query.order_by(SMS.created_at.desc()).limit(500).all()
    return ok([r.to_dict() for r in rows])
