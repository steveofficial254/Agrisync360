from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from app.models.user import User


def role_required(*roles):
    """
    Decorator that checks if current user has 
    one of specified roles.
    Usage: @role_required('admin', 'ngo_partner')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({
                    "success": False,
                    "error": "USER_NOT_FOUND",
                    "message": "User not found"
                }), 404
            if user.role not in roles:
                return jsonify({
                    "success": False,
                    "error": "FORBIDDEN",
                    "message": f"Access denied. Required role: {' or '.join(roles)}"
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(fn):
    return role_required('admin')(fn)

def farmer_required(fn):
    return role_required('farmer')(fn)

def agro_dealer_required(fn):
    return role_required('agro_dealer')(fn)

def ngo_required(fn):
    return role_required('ngo_partner')(fn)

def subscription_required(plan_level='basic'):
    """
    Decorator that checks farmer has active subscription.
    plan_level: 'basic' or 'pro'
    Pro features require pro subscription.
    Basic features require any active subscription.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from app.services.mpesa_service import MpesaService
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            # Non-farmers always have access (admin, NGO, dealer)
            if user and user.role != 'farmer':
                return fn(*args, **kwargs)
            
            # Get farmer profile
            from app.models.farmer import Farmer
            farmer = Farmer.query.filter_by(
                user_id=current_user_id
            ).first()
            
            if not farmer:
                return jsonify({
                    "success": False,
                    "error": "PROFILE_REQUIRED",
                    "message": "Complete your profile to access this feature"
                }), 403
            
            # Check subscription
            sub = MpesaService.check_subscription_status(farmer.id)
            
            if not sub.get('is_active'):
                return jsonify({
                    "success": False,
                    "error": "SUBSCRIPTION_REQUIRED",
                    "message": "Active subscription required. "
                               "Subscribe via M-Pesa to access this feature.",
                    "data": {
                        "plans": {
                            "basic_monthly": "KSH 99/month",
                            "pro_monthly": "KSH 299/month"
                        },
                        "subscribe_url": "/api/payments/subscribe"
                    }
                }), 402
            
            # Check pro requirement
            if plan_level == 'pro':
                pro_plans = ['pro_monthly', 'pro_annual']
                if sub.get('plan') not in pro_plans:
                    return jsonify({
                        "success": False,
                        "error": "PRO_SUBSCRIPTION_REQUIRED",
                        "message": "This feature requires a Pro subscription.",
                        "data": {
                            "current_plan": sub.get('plan'),
                            "upgrade_to": "pro_monthly",
                            "price": "KSH 299/month",
                            "upgrade_url": "/api/payments/subscribe"
                        }
                    }), 402
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
