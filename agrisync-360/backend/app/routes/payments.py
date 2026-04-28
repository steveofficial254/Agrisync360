from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.farmer import Farmer
from app.models.payment import Payment
from app.services.mpesa_service import MpesaService

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status

@payments_bp.post("/subscribe")
@jwt_required()
def subscribe():
    payload = request.get_json() or {}
    farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first_or_404()
    data = MpesaService.stk_push(payload["phone_number"], payload["amount"], payload.get("account_ref", "AGRISYNC"), payload.get("description", "Subscription"))
    p = Payment(farmer_id=farmer.id, plan=payload["plan"], amount_ksh=payload["amount"], phone_number=payload["phone_number"], status="pending", checkout_request_id=data.get("CheckoutRequestID"), merchant_request_id=data.get("MerchantRequestID"))
    db.session.add(p); db.session.commit()
    return ok({"checkout_request_id": p.checkout_request_id, "merchant_request_id": p.merchant_request_id}, "STK push initiated", 201)

@payments_bp.get("/status/<checkout_request_id>")
@jwt_required()
def status(checkout_request_id):
    return ok(MpesaService.verify_payment(checkout_request_id))

@payments_bp.post("/mpesa/callback")
def callback():
    return ok({"processed": MpesaService.handle_callback(request.get_json() or {})}, "Callback processed")

@payments_bp.get("/history")
@jwt_required()
def history():
    farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first_or_404()
    rows = Payment.query.filter_by(farmer_id=farmer.id).order_by(Payment.created_at.desc()).all()
    return ok([r.to_dict() for r in rows])

@payments_bp.get("/subscription")
@jwt_required()
def subscription():
    farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first_or_404()
    row = Payment.query.filter_by(farmer_id=farmer.id, status="completed").order_by(Payment.created_at.desc()).first()
    return ok(row.to_dict() if row else {"active": False})
