import logging
import os

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt, jwt_required
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.extensions import db, limiter
from app.models.user import User
from app.schemas.user_schema import LoginSchema, OTPVerifySchema, RegisterSchema
from app.services.sms_service import SMSService
from app.utils.helpers import normalize_phone

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


def _is_dev():
    return os.getenv("FLASK_ENV", "development") == "development"


# ---------------------------------------------------------------------------
# TASK 1 — Register
# ---------------------------------------------------------------------------
@auth_bp.post("/register")
@limiter.limit("5 per minute")
def register():
    try:
        payload = RegisterSchema().load(request.get_json() or {})
    except ValidationError as e:
        return err(
            "VALIDATION_ERROR",
            "Invalid request data",
            400,
            details=e.messages,
        )

    phone = normalize_phone(payload["phone"])

    # FIX 4 — wrap DB operations in try/except
    try:
        if User.query.filter_by(phone=phone).first():
            return err("DUPLICATE_PHONE", "Phone number already registered", 409)

        user = User(
            phone=phone,
            role=payload.get("role", "farmer"),
            is_active=True,
            is_verified=False,
        )
        user.set_password(payload["password"])
        otp = user.generate_otp()

        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("DUPLICATE_PHONE", "Phone number already registered", 409)
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error during register: %s", str(e))
        return err("SERVER_ERROR", "Database error. Please try again.", 500)

    # FIX 2 — SMS failure does NOT cause registration to fail
    try:
        SMSService.send_otp(phone, otp)
    except Exception as sms_err:
        logger.warning("SMS send failed (registration proceeds): %s", str(sms_err))

    # FIX 3 — Response format
    response_data = {
        "user_id": str(user.id),
        "phone": phone,
    }
    # FIX 2 — Return OTP in dev mode so testers don't need real SMS
    if _is_dev():
        response_data["otp"] = otp

    return ok(response_data, "Registration successful. Check your phone for OTP.", 201)


# ---------------------------------------------------------------------------
# TASK 2 — Verify OTP
# ---------------------------------------------------------------------------
@auth_bp.post("/verify-otp")
@limiter.limit("5 per minute")
def verify_otp():
    try:
        payload = OTPVerifySchema().load(request.get_json() or {})
    except ValidationError as e:
        return err("VALIDATION_ERROR", "Invalid request data", 400, details=e.messages)

    phone = normalize_phone(payload["phone"])
    user = User.query.filter_by(phone=phone).first()

    if not user:
        return err("USER_NOT_FOUND", "No account found with this phone number", 404)

    if not user.verify_otp(payload["otp_code"]):
        return err("INVALID_OTP", "OTP is invalid or has expired", 400)

    try:
        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error during verify-otp: %s", str(e))
        return err("SERVER_ERROR", "Database error. Please try again.", 500)

    access = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh = create_refresh_token(identity=str(user.id))

    return ok(
        {
            "access_token": access,
            "refresh_token": refresh,
            "user": {
                "id": str(user.id),
                "phone": user.phone,
                "role": user.role,
                "is_verified": user.is_verified,
            },
        },
        "Phone verified successfully",
    )


# ---------------------------------------------------------------------------
# TASK 3 — Login
# ---------------------------------------------------------------------------
@auth_bp.post("/login")
@limiter.limit("5 per minute")
def login():
    try:
        payload = LoginSchema().load(request.get_json() or {})
    except ValidationError as e:
        return err("VALIDATION_ERROR", "Invalid request data", 400, details=e.messages)

    phone = normalize_phone(payload["phone"])
    user = User.query.filter_by(phone=phone).first()

    if not user or not user.check_password(payload["password"]):
        return err("INVALID_CREDENTIALS", "Invalid phone number or password", 401)

    if not user.is_verified:
        return err("ACCOUNT_NOT_VERIFIED", "Please verify your phone number before logging in", 403)

    if not user.is_active:
        return err("ACCOUNT_DISABLED", "Your account has been disabled. Contact support.", 403)

    access = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh = create_refresh_token(identity=str(user.id))

    return ok(
        {
            "access_token": access,
            "refresh_token": refresh,
            "user": {
                "id": str(user.id),
                "phone": user.phone,
                "role": user.role,
                "is_verified": user.is_verified,
            },
        },
        "Login successful",
    )


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------
@auth_bp.post("/refresh")
@limiter.limit("1000 per hour")  # More lenient for token refresh
@jwt_required(refresh=True)
def refresh():
    from flask_jwt_extended import get_jwt_identity
    return ok({"access_token": create_access_token(identity=get_jwt_identity())}, "Token refreshed")


# ---------------------------------------------------------------------------
# Resend OTP
# ---------------------------------------------------------------------------
@auth_bp.post("/resend-otp")
@limiter.limit("5 per minute")
def resend_otp():
    try:
        payload = request.get_json() or {}
        phone = normalize_phone(payload.get("phone", ""))
        user = User.query.filter_by(phone=phone).first()
        if not user:
            return err("USER_NOT_FOUND", "No account found with this phone number", 404)
        otp = user.generate_otp()
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error on resend-otp: %s", str(e))
        return err("SERVER_ERROR", "Database error. Please try again.", 500)

    try:
        SMSService.send_otp(phone, otp)
    except Exception as sms_err:
        logger.warning("SMS send failed on resend-otp: %s", str(sms_err))

    response_data = {}
    if _is_dev():
        response_data["otp"] = otp

    return ok(response_data, "OTP resent. Check your phone.")


# ---------------------------------------------------------------------------
# Verify Reset OTP
# ---------------------------------------------------------------------------
@auth_bp.post("/verify-reset-otp")
@limiter.limit("5 per minute")
def verify_reset_otp():
    try:
        payload = request.get_json() or {}
        phone = normalize_phone(payload.get("phone", ""))
        otp_code = payload.get("otp", "")
        
        user = User.query.filter_by(phone=phone).first()
        if not user:
            return err("USER_NOT_FOUND", "No account found with this phone number", 404)
        
        # Verify OTP matches and not expired
        if not user.verify_otp(otp_code):
            return err("INVALID_OTP", "Invalid or expired OTP", 400)
        
        # Verify otp_type = 'password_reset'
        if user.otp_type != 'password_reset':
            return err("INVALID_OTP_TYPE", "OTP not for password reset", 400)
        
        # Generate short-lived reset token (10 minutes)
        import secrets
        reset_token = secrets.token_urlsafe(32)
        
        # Store in Redis: reset_token:{token} → user_id, TTL 600s
        from app.extensions import redis_client
        redis_client.setex(f"reset_token:{reset_token}", 600, str(user.id))
        
        # Clear OTP from user record
        user.otp_code = None
        user.otp_expires_at = None
        user.otp_type = None
        db.session.commit()
        
        response_data = {"reset_token": reset_token}
        return ok(response_data, "OTP verified. Use reset_token to set new password.")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error on verify-reset-otp: %s", str(e))
        return err("SERVER_ERROR", "Database error. Please try again.", 500)
    except Exception as e:
        logger.error("Error on verify-reset-otp: %s", str(e))
        return err("SERVER_ERROR", "Server error. Please try again.", 500)


# ---------------------------------------------------------------------------
# Reset Password with Token
# ---------------------------------------------------------------------------
@auth_bp.post("/reset-password")
@limiter.limit("5 per minute")
def reset_password():
    try:
        payload = request.get_json() or {}
        reset_token = payload.get("reset_token", "")
        new_password = payload.get("new_password", "")
        
        if not reset_token or not new_password:
            return err("VALIDATION_ERROR", "reset_token and new_password are required", 400)
        
        # Validate new password
        if len(new_password) < 8:
            return err("VALIDATION_ERROR", "Password must be at least 8 characters", 400)
        
        if not any(c.isupper() for c in new_password):
            return err("VALIDATION_ERROR", "Password must contain at least 1 uppercase letter", 400)
        
        if not any(c.isdigit() for c in new_password):
            return err("VALIDATION_ERROR", "Password must contain at least 1 number", 400)
        
        # Get reset token from Redis
        from app.extensions import redis_client
        user_id_str = redis_client.get(f"reset_token:{reset_token}")
        
        if not user_id_str:
            return err("INVALID_TOKEN", "Invalid or expired reset token", 400)
        
        user = User.query.get(user_id_str)
        if not user:
            return err("USER_NOT_FOUND", "User not found", 404)
        
        # Check if same as current password
        if user.check_password(new_password):
            return err("VALIDATION_ERROR", "New password cannot be same as current password", 400)
        
        # Set new password
        user.set_password(new_password)
        db.session.commit()
        
        # Delete reset token from Redis
        redis_client.delete(f"reset_token:{reset_token}")
        
        # Send confirmation SMS
        try:
            message = ("Your AgriSync 360 password has been changed. "
                     "If you did not do this contact us immediately. "
                     "AgriSync 360")
            SMSService.send_sms(user.phone, message, 'password_reset', user.id)
        except Exception as sms_err:
            logger.warning("SMS send failed on password reset confirmation: %s", str(sms_err))
        
        return ok({}, "Password reset successfully. Please login.")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error on reset-password: %s", str(e))
        return err("SERVER_ERROR", "Database error. Please try again.", 500)
    except Exception as e:
        logger.error("Error on reset-password: %s", str(e))
        return err("SERVER_ERROR", "Server error. Please try again.", 500)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------
@auth_bp.post("/logout")
@jwt_required()
def logout():
    _ = get_jwt()
    return ok({}, "Logged out successfully")


# ---------------------------------------------------------------------------
# Forgot / Reset password
# ---------------------------------------------------------------------------
@auth_bp.post("/forgot-password")
@limiter.limit("5 per minute")
def forgot_password():
    try:
        phone = normalize_phone((request.get_json() or {}).get("phone", ""))
        user = User.query.filter_by(phone=phone).first()
        if not user:
            return err("USER_NOT_FOUND", "No account found with this phone number", 404)
        otp = user.generate_otp(otp_type='password_reset')
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error on forgot-password: %s", str(e))
        return err("SERVER_ERROR", "Database error. Please try again.", 500)

    try:
        SMSService.send_otp(phone, otp)
    except Exception as sms_err:
        logger.warning("SMS send failed on forgot-password: %s", str(sms_err))

    response_data = {}
    if _is_dev():
        response_data["otp"] = otp

    return ok(response_data, "Password reset OTP sent. Check your phone.")


@auth_bp.post("/reset-password-otp")
@limiter.limit("5 per minute")
def reset_password_otp():
    try:
        payload = request.get_json() or {}
        phone = normalize_phone(payload.get("phone", ""))
        user = User.query.filter_by(phone=phone).first()
        if not user or not user.verify_otp(payload.get("otp_code", "")):
            return err("INVALID_OTP", "Invalid or expired OTP", 400)
        user.set_password(payload.get("password", ""))
        user.otp_code = None
        user.otp_expires_at = None
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error on reset-password: %s", str(e))
        return err("SERVER_ERROR", "Database error. Please try again.", 500)

    return ok({}, "Password reset successful")
