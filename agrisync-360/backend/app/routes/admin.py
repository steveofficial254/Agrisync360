from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.models.alert import Alert
from app.models.farmer import Farmer
from app.models.payment import Payment
from app.models.sms import SMS
from app.utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status

@admin_bp.get("/stats")
@jwt_required()
@admin_required
def stats():
    return ok({"farmers": Farmer.query.count(), "subscriptions": Payment.query.filter_by(status="completed").count(), "sms_sent": SMS.query.filter(SMS.status.in_(["sent","delivered"])).count()})

@admin_bp.get("/farmers")
@jwt_required()
@admin_required
def farmers():
    page = int(request.args.get("page", 1)); per_page = int(request.args.get("per_page", 20))
    pg = Farmer.query.paginate(page=page, per_page=per_page, error_out=False)
    return ok({"items": [f.to_dict() for f in pg.items], "total": pg.total})

@admin_bp.get("/revenue")
@jwt_required()
@admin_required
def revenue():
    total = Payment.query.with_entities(func.sum(Payment.amount_ksh)).filter_by(status="completed").scalar() or 0
    by_plan = Payment.query.with_entities(Payment.plan, func.sum(Payment.amount_ksh)).filter_by(status="completed").group_by(Payment.plan).all()
    return ok({"total": float(total), "breakdown": [{"plan": p, "amount": float(a)} for p,a in by_plan]})

@admin_bp.get("/sms-logs")
@jwt_required()
@admin_required
def sms_logs():
    return ok([r.to_dict() for r in SMS.query.order_by(SMS.created_at.desc()).limit(500).all()])

@admin_bp.get("/alerts")
@jwt_required()
@admin_required
def alerts():
    return ok([a.to_dict() for a in Alert.query.order_by(Alert.created_at.desc()).limit(500).all()])

@admin_bp.post("/alerts/send")
@jwt_required()
@admin_required
def send_alert():
    from app.extensions import db
    payload = request.get_json() or {}
    alert = Alert(**payload)
    db.session.add(alert); db.session.commit()
    return ok(alert.to_dict(), "Alert created", 201)

@admin_bp.get("/subscriptions")
@jwt_required()
@admin_required
def subscriptions():
    data = Payment.query.with_entities(Payment.plan, func.count(Payment.id)).group_by(Payment.plan).all()
    return ok([{"plan": p, "count": c} for p,c in data])
