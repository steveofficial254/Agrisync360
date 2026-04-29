from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.extensions import db
from app.models.farmer import Farmer
from app.models.payment import Payment
from app.services.mpesa_service import MpesaService
from app.utils.plans import PLAN_PRICES, PLAN_FEATURES, get_plan_features, get_plan_tier

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


logger = logging.getLogger(__name__)


@payments_bp.post("/subscribe")
@jwt_required()
def subscribe():
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found. Please complete your profile first.", 404)
        
        payload = request.get_json() or {}
        
        # Validate required fields
        if "plan" not in payload:
            return err("validation_error", "Missing required field: plan", 400)
        
        # Validate plan
        if payload["plan"] not in PLAN_PRICES:
            return err("validation_error", f"Invalid plan. Must be one of: {', '.join(PLAN_PRICES.keys())}", 400)
        
        # Get phone number (use farmer's phone if not provided)
        phone = payload.get("phone", farmer.user.phone)
        if not phone:
            return err("validation_error", "Phone number is required", 400)
        
        # Get plan price
        amount = PLAN_PRICES[payload["plan"]]
        
        # Initiate M-Pesa STK push
        try:
            result = MpesaService.stk_push(
                phone_number=phone,
                amount=amount,
                account_ref=f"AGRISYNC-{payload['plan']}",
                description=f"AgriSync 360 {payload['plan'].replace('_', ' ').title()} Subscription",
                farmer_id=farmer.id,
                plan=payload["plan"]
            )
            
            return jsonify({
                "success": True,
                "data": {
                    "checkout_request_id": result["checkout_request_id"],
                    "merchant_request_id": result["merchant_request_id"],
                    "customer_message": result["customer_message"]
                },
                "message": "Payment initiated. Please check your phone for M-Pesa prompt."
            }), 200
            
        except Exception as mpesa_error:
            logger.error(f"M-Pesa initiation error: {str(mpesa_error)}")
            return err("payment_failed", "Failed to initiate payment. Please try again.", 500)
        
    except Exception as e:
        logger.error(f"Subscribe error: {str(e)}")
        return err("server_error", "Failed to process subscription", 500)


@payments_bp.post("/mpesa/callback")
def mpesa_callback():
    """M-Pesa callback endpoint - no authentication required"""
    try:
        callback_data = request.get_json() or {}
        
        # Process the callback
        processed = MpesaService.handle_callback(callback_data)
        
        # Always return 200 to M-Pesa (even on error)
        return jsonify({
            "ResultCode": 0,
            "ResultDesc": "Accepted"
        }), 200
        
    except Exception as e:
        logger.error(f"M-Pesa callback error: {str(e)}")
        # Still return 200 to M-Pesa to avoid retries
        return jsonify({
            "ResultCode": 0,
            "ResultDesc": "Accepted"
        }), 200


@payments_bp.get("/status/<checkout_request_id>")
@jwt_required()
def payment_status(checkout_request_id):
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        payment = Payment.query.filter_by(
            checkout_request_id=checkout_request_id,
            farmer_id=farmer.id
        ).first()
        
        if not payment:
            return err("not_found", "Payment not found", 404)
        
        return jsonify({
            "success": True,
            "data": {
                "status": payment.status,
                "plan": payment.plan,
                "amount_ksh": payment.amount_ksh,
                "receipt_number": payment.mpesa_receipt_number,
                "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
                "subscription_start": payment.subscription_start.isoformat() if payment.subscription_start else None,
                "subscription_end": payment.subscription_end.isoformat() if payment.subscription_end else None
            },
            "message": "Payment status retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        return err("server_error", "Failed to retrieve payment status", 500)


@payments_bp.get("/subscription")
@jwt_required()
def subscription_status():
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        subscription_info = MpesaService.check_subscription_status(farmer.id)
        
        # Get plan features
        from app.utils.plans import get_plan_features, PLAN_PRICES
        plan_name = subscription_info.get('plan', 'free')
        features = get_plan_features(plan_name)
        
        # Calculate upgrade info
        tier = 'basic' if 'basic' in plan_name else ('pro' if 'pro' in plan_name else 'free')
        upgrade_available = tier != 'pro'
        upgrade_plan = 'pro_monthly' if upgrade_available else None
        upgrade_price = PLAN_PRICES.get('pro_monthly', 299)
        
        # Add features to response
        subscription_info['features'] = features
        subscription_info['tier'] = tier
        subscription_info['upgrade_available'] = upgrade_available
        if upgrade_available:
            subscription_info['upgrade_plan'] = upgrade_plan
            subscription_info['upgrade_price_ksh'] = upgrade_price
            subscription_info['upgrade_message'] = "Upgrade to Pro for disease risk alerts and unlimited SMS"
        
        return jsonify({
            "success": True,
            "data": subscription_info,
            "message": "Subscription status retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Subscription status error: {str(e)}")
        return err("server_error", "Failed to retrieve subscription status", 500)


@payments_bp.get("/history")
@jwt_required()
def payment_history():
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        # Pagination
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 100)
        
        pg = Payment.query.filter_by(farmer_id=farmer.id)\
                         .order_by(Payment.created_at.desc())\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            "success": True,
            "data": {
                "items": [payment.to_dict() for payment in pg.items],
                "total": pg.total,
                "page": page,
                "per_page": per_page,
                "pages": pg.pages
            },
            "message": "Payment history retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Payment history error: {str(e)}")
        return err("server_error", "Failed to retrieve payment history", 500)

@payments_bp.get("/plans")
def plans():
    """Get all available plans with prices and features"""
    try:
        plans_data = []
        
        for plan_id, price in PLAN_PRICES.items():
            features = get_plan_features(plan_id)
            
            # Determine plan display name
            if 'basic' in plan_id:
                name = "Basic Monthly"
                billing = "monthly"
                popular = False
            elif 'pro' in plan_id:
                name = "Pro Monthly"
                billing = "monthly"
                popular = True
            elif 'annual' in plan_id:
                tier = 'basic' if 'basic' in plan_id else 'pro'
                name = f"{tier.title()} Annual"
                billing = "annual"
                popular = False
            else:
                name = plan_id.replace('_', ' ').title()
                billing = "custom"
                popular = False
            
            plans_data.append({
                "plan_id": plan_id,
                "name": name,
                "price_ksh": price,
                "billing": billing,
                "features": features,
                "popular": popular
            })
        
        return jsonify({
            "success": True,
            "data": plans_data,
            "message": "Plans retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Plans error: {str(e)}")
        return err("server_error", "Failed to retrieve plans", 500)

@payments_bp.post("/upgrade")
@jwt_required()
def upgrade():
    """Upgrade subscription plan"""
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        payload = request.get_json() or {}
        plan = payload.get("plan")
        
        if not plan:
            return err("validation_error", "plan parameter is required", 400)
        
        if plan not in PLAN_PRICES:
            return err("validation_error", "Invalid plan selected", 400)
        
        # Cannot downgrade (must wait for expiry)
        current_sub = MpesaService.check_subscription_status(farmer.id)
        if current_sub.get('is_active'):
            current_tier = get_plan_tier(current_sub.get('plan'))
            new_tier = get_plan_tier(plan)
            
            if new_tier == 'basic' and current_tier == 'pro':
                return err("validation_error", "Cannot downgrade from Pro to Basic. Wait for current subscription to expire.", 400)
        
        # Initiate new subscription with proration
        amount = PLAN_PRICES[plan]
        phone_last6 = farmer.user.phone[-6:] if len(farmer.user.phone) >= 6 else farmer.user.phone
        
        # Create STK push
        result = MpesaService.initiate_stk_push(
            phone_number=farmer.user.phone,
            amount=amount,
            account_reference=f"AGRI{phone_last6}",
            transaction_desc=f"AgriSync {plan.replace('_', ' ').title()} Subscription"
        )
        
        if result.get('error'):
            return err("payment_failed", result.get('error'), 400)
        
        return jsonify({
            "success": True,
            "data": {
                "checkout_request_id": result.get('checkout_request_id'),
                "plan": plan,
                "amount_ksh": amount,
                "message": f"Payment initiated for {plan.replace('_', ' ').title()} subscription"
            },
            "message": "Upgrade initiated successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Upgrade error: {str(e)}")
        return err("server_error", "Failed to process upgrade", 500)
