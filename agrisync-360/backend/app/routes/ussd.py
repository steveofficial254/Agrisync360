from flask import Blueprint, request

from app.services.ussd_service import USSDService

ussd_bp = Blueprint("ussd", __name__, url_prefix="/api/ussd")

@ussd_bp.post("/callback")
def callback():
    p = request.form.to_dict() if request.form else (request.get_json() or {})
    return USSDService().handle_session(p.get("sessionId"), p.get("serviceCode"), p.get("phoneNumber"), p.get("text", "")), 200, {"Content-Type": "text/plain"}
