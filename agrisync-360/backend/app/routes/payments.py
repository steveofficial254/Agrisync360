from datetime import date
import logging
import time

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError

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
        logger.info(f"Subscription request payload: {payload}")
        
        # Support both {plan, phone} object and separate fields
        plan_id = payload.get("plan")
        if not plan_id:
            return err("validation_error", "Missing required field: plan", 400)
        
        if plan_id not in PLAN_PRICES:
            return err("validation_error", f"Invalid plan. Must be one of: {', '.join(PLAN_PRICES.keys())}", 400)
        
        phone = payload.get("phone") or farmer.user.phone
        if not phone:
            return err("validation_error", "Phone number is required", 400)
        
        amount = PLAN_PRICES[plan_id]
        
        try:
            logger.info(f"Initiating M-Pesa payment: {amount} KSH to {phone} for plan {plan_id}")
            
            checkout_request_id = f"ws_CO_{plan_id}_{farmer.id}_{int(time.time())}"
            merchant_request_id = f"ws_MR_{plan_id}_{farmer.id}_{int(time.time())}"

            # Save a pending payment record so polling can track it
            from datetime import date, timedelta
            payment = Payment(
                farmer_id=farmer.id,
                plan=plan_id,
                amount_ksh=amount,
                phone_number=phone,
                checkout_request_id=checkout_request_id,
                merchant_request_id=merchant_request_id,
                status="pending",
            )
            db.session.add(payment)
            db.session.commit()
            logger.info(f"Pending payment record created: {payment.id}")
            
            return jsonify({
                "success": True,
                "data": {
                    "checkout_request_id": checkout_request_id,
                    "merchant_request_id": merchant_request_id,
                    "customer_message": f"Payment of KSH {amount} initiated for {plan_id.replace('_', ' ').title()} subscription"
                },
                "message": "Payment initiated. Please check your phone for M-Pesa prompt."
            }), 200
            
        except Exception as mpesa_error:
            import traceback
            db.session.rollback()
            logger.error(f"M-Pesa initiation error: {str(mpesa_error)}")
            logger.error(traceback.format_exc())
            return err("payment_failed", "Failed to initiate payment. Please try again.", 500)
        
    except Exception as e:
        logger.error(f"Subscribe error: {str(e)}")
        return err("server_error", "Failed to process subscription", 500)


@payments_bp.post("/activate-dev")
@jwt_required()
def activate_dev():
    """DEV ONLY — simulate M-Pesa callback completing a pending payment."""
    import os
    if os.getenv("FLASK_ENV") == "production":
        return err("forbidden", "Not available in production", 403)

    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)

        payload = request.get_json() or {}
        checkout_request_id = payload.get("checkout_request_id")

        if not checkout_request_id:
            return err("validation_error", "checkout_request_id is required", 400)

        payment = Payment.query.filter_by(
            checkout_request_id=checkout_request_id,
            farmer_id=farmer.id
        ).first()

        if not payment:
            return err("not_found", "Payment record not found", 404)

        from datetime import date, timedelta
        today = date.today()
        duration_days = 365 if "annual" in payment.plan else 30

        payment.status = "completed"
        payment.payment_date = date.today()
        payment.subscription_start = today
        payment.subscription_end = today + timedelta(days=duration_days)
        payment.mpesa_receipt_number = f"DEV{int(time.time())}"
        db.session.commit()

        logger.info(f"DEV: Payment {payment.id} activated for farmer {farmer.id}, plan={payment.plan}, expires={payment.subscription_end}")

        return jsonify({
            "success": True,
            "data": {
                "status": "completed",
                "plan": payment.plan,
                "subscription_end": payment.subscription_end.isoformat(),
            },
            "message": f"Subscription activated! Plan: {payment.plan}"
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"activate-dev error: {str(e)}")
        return err("server_error", "Failed to activate subscription", 500)


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
        user_id = get_jwt_identity()
        logger.info(f"Subscription status request - User ID: {user_id}")
        
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        logger.info(f"Farmer found for subscription: {farmer is not None}")
        
        if not farmer:
            logger.info("No farmer profile - returning free subscription status")
            # Return default subscription status for users without profile
            return jsonify({
                "success": True,
                "data": {
                    "is_active": False,
                    "plan": "free",
                    "tier": "free",
                    "subscription_start": None,
                    "subscription_end": None,
                    "features": [],
                    "upgrade_available": True,
                    "upgrade_plan": "basic_monthly",
                    "upgrade_price_ksh": 99,
                    "upgrade_message": "Complete your profile to subscribe to premium features",
                    "profile_required": True
                },
                "message": "Subscription status retrieved (profile required)"
            }), 200
        
        logger.info(f"Checking subscription for farmer ID: {farmer.id}")
        
        # Check for active completed payment
        from datetime import date, timedelta
        today = date.today()
        active_payment = Payment.query.filter_by(
            farmer_id=farmer.id,
            status='completed'
        ).filter(
            Payment.subscription_end >= today
        ).order_by(Payment.subscription_end.desc()).first()
        
        if active_payment:
            from app.utils.plans import get_plan_features, get_plan_tier, PLAN_PRICES
            tier = get_plan_tier(active_payment.plan)
            features = get_plan_features(active_payment.plan)
            days_remaining = (active_payment.subscription_end - today).days
            
            subscription_info = {
                "is_active": True,
                "plan": active_payment.plan,
                "tier": tier,
                "subscription_start": active_payment.subscription_start.isoformat() if active_payment.subscription_start else None,
                "subscription_end": active_payment.subscription_end.isoformat() if active_payment.subscription_end else None,
                "days_remaining": days_remaining,
                "features": features,
                "upgrade_available": tier != 'pro',
            }
            if tier != 'pro':
                subscription_info['upgrade_plan'] = 'pro_monthly'
                subscription_info['upgrade_price_ksh'] = PLAN_PRICES.get('pro_monthly', 299)
                subscription_info['upgrade_message'] = "Upgrade to Pro for disease risk alerts and unlimited SMS"
        else:
            # No active subscription — return free tier
            from app.utils.plans import get_plan_features, PLAN_PRICES
            features = get_plan_features('free')
            subscription_info = {
                "is_active": False,
                "plan": "free",
                "tier": "free",
                "subscription_start": None,
                "subscription_end": None,
                "days_remaining": 0,
                "features": features,
                "upgrade_available": True,
                "upgrade_plan": "basic_monthly",
                "upgrade_price_ksh": PLAN_PRICES.get('basic_monthly', 99),
                "upgrade_message": "Upgrade to Basic for crop advisories and market intelligence",
            }
        
        logger.info(f"Subscription info: tier={subscription_info['tier']}, active={subscription_info['is_active']}")
        
        return jsonify({
            "success": True,
            "data": subscription_info,
            "message": "Subscription status retrieved successfully"
        }), 200
        
    except Exception as e:
        import traceback
        logger.error(f"Subscription status error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
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
    """Upgrade subscription plan — re-uses the subscribe flow."""
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)

        payload = request.get_json() or {}
        plan_id = payload.get("plan")

        if not plan_id:
            return err("validation_error", "plan parameter is required", 400)
        if plan_id not in PLAN_PRICES:
            return err("validation_error", "Invalid plan selected", 400)

        # Prevent downgrade while active
        current_sub = MpesaService.check_subscription_status(farmer.id)
        if current_sub.get("is_active"):
            current_tier = get_plan_tier(current_sub.get("plan"))
            new_tier = get_plan_tier(plan_id)
            if new_tier == "basic" and current_tier == "pro":
                return err(
                    "validation_error",
                    "Cannot downgrade from Pro to Basic. Wait for current subscription to expire.",
                    400,
                )

        # Delegate to subscribe endpoint logic
        amount = PLAN_PRICES[plan_id]
        phone = farmer.user.phone

        checkout_request_id = f"ws_CO_{plan_id}_{farmer.id}_{int(time.time())}"
        merchant_request_id = f"ws_MR_{plan_id}_{farmer.id}_{int(time.time())}"

        payment = Payment(
            farmer_id=farmer.id,
            plan=plan_id,
            amount_ksh=amount,
            phone_number=phone,
            checkout_request_id=checkout_request_id,
            merchant_request_id=merchant_request_id,
            status="pending",
        )
        db.session.add(payment)
        db.session.commit()

        return jsonify({
            "success": True,
            "data": {
                "checkout_request_id": checkout_request_id,
                "plan": plan_id,
                "amount_ksh": amount,
                "message": f"Payment initiated for {plan_id.replace('_', ' ').title()} subscription",
            },
            "message": "Upgrade initiated successfully",
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Upgrade error: {str(e)}")
        return err("server_error", "Failed to process upgrade", 500)
