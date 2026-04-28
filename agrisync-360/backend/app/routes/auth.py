import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt, jwt_required
from marshmallow import ValidationError

from app.extensions import db, limiter
from app.models.user import User
from app.schemas.user_schema import LoginSchema, OTPVerifySchema, RegisterSchema
from app.services.sms_service import SMSService
from app.utils.helpers import normalize_phone

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


def err(error="error", message="Request failed", status=400):
    return jsonify({"success": False, "error": error, "message": message}), status


@auth_bp.post("/register")
@limiter.limit("5 per minute")
def register():
    try:
        payload = RegisterSchema().load(request.get_json() or {})
        phone = normalize_phone(payload["phone"])
        if User.query.filter_by(phone=phone).first():
            return err("conflict", "Phone already registered", 409)
        user = User(phone=phone, role=payload.get("role", "farmer"))
        user.set_password(payload["password"])
        otp = user.generate_otp()
        db.session.add(user)
        db.session.commit()
        SMSService().send_otp(phone, otp)
        return ok({"user_id": str(user.id)}, "OTP sent", 201)
    except ValidationError as e:
        message = "Invalid phone number format" if "phone" in str(e).lower() else str(e)
        return err("validation_error", message, 400)
    except Exception as e:
        logger.exception("register failed")
        return err("server_error", str(e), 500)


@auth_bp.post("/verify-otp")
@limiter.limit("5 per minute")
def verify_otp():
    payload = OTPVerifySchema().load(request.get_json() or {})
    user = User.query.filter_by(phone=normalize_phone(payload["phone"])).first()
    if not user or not user.verify_otp(payload["otp_code"]):
        return err("invalid_otp", "Invalid or expired OTP", 400)
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.session.commit()
    access = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh = create_refresh_token(identity=str(user.id))
    return ok({"access_token": access, "refresh_token": refresh, "user": user.to_dict()}, "OTP verified")


@auth_bp.post("/login")
@limiter.limit("5 per minute")
def login():
    payload = LoginSchema().load(request.get_json() or {})
    user = User.query.filter_by(phone=normalize_phone(payload["phone"])).first()
    if not user or not user.check_password(payload["password"]):
        return err("invalid_credentials", "Invalid phone or password", 401)
    access = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh = create_refresh_token(identity=str(user.id))
    return ok({"access_token": access, "refresh_token": refresh, "user": user.to_dict(), "role": user.role}, "Login successful")


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    from flask_jwt_extended import get_jwt_identity

    return ok({"access_token": create_access_token(identity=get_jwt_identity())}, "Token refreshed")


@auth_bp.post("/resend-otp")
@limiter.limit("5 per minute")
def resend_otp():
    phone = normalize_phone((request.get_json() or {}).get("phone", ""))
    user = User.query.filter_by(phone=phone).first()
    if not user:
        return err("not_found", "User not found", 404)
    otp = user.generate_otp()
    db.session.commit()
    SMSService().send_otp(phone, otp)
    return ok({}, "OTP resent")


@auth_bp.post("/logout")
@jwt_required()
def logout():
    _ = get_jwt()
    return ok({}, "Logged out")


@auth_bp.post("/forgot-password")
@limiter.limit("5 per minute")
def forgot_password():
    phone = normalize_phone((request.get_json() or {}).get("phone", ""))
    user = User.query.filter_by(phone=phone).first()
    if not user:
        return err("not_found", "User not found", 404)
    otp = user.generate_otp()
    db.session.commit()
    SMSService().send_otp(phone, otp)
    return ok({}, "Password reset OTP sent")


@auth_bp.post("/reset-password")
@limiter.limit("5 per minute")
def reset_password():
    payload = request.get_json() or {}
    phone = normalize_phone(payload.get("phone", ""))
    user = User.query.filter_by(phone=phone).first()
    if not user or not user.verify_otp(payload.get("otp_code", "")):
        return err("invalid_otp", "Invalid or expired OTP", 400)
    user.set_password(payload.get("password", ""))
    user.otp_code = None
    user.otp_expires_at = None
    db.session.commit()
    return ok({}, "Password reset successful")
