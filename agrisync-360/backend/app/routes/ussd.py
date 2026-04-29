from flask import Blueprint, request, jsonify
from app.services.ussd_service import USSDService
import logging

logger = logging.getLogger(__name__)
ussd_bp = Blueprint('ussd', __name__)

@ussd_bp.route('/api/ussd/callback', methods=['POST'])
def ussd_callback():
    """
    Africa's Talking USSD webhook.
    No authentication — AT calls this directly.
    Must respond within 5 seconds.
    """
    try:
        # AT sends form data not JSON
        session_id = request.form.get('sessionId', '')
        service_code = request.form.get('serviceCode', '')
        phone_number = request.form.get('phoneNumber', '')
        text = request.form.get('text', '')
        
        logger.info(
            f"USSD: session={session_id} "
            f"phone={phone_number} text={text}"
        )
        
        # Handle session
        response = USSDService.handle(
            session_id, service_code, phone_number, text
        )
        
        logger.info(f"USSD response: {response[:50]}...")
        
        # AT expects plain text response
        return response, 200, {'Content-Type': 'text/plain'}
        
    except Exception as e:
        logger.error(f"USSD error: {str(e)}")
        return "END Samahani, kuna tatizo. Jaribu tena.\nAgriSync 360", 200, \
               {'Content-Type': 'text/plain'}

@ussd_bp.route('/api/ussd/test', methods=['GET'])
def ussd_test():
    """
    Test USSD flow without Africa's Talking.
    Only available in development mode.
    """
    import os
    if os.getenv('FLASK_ENV') != 'development':
        return jsonify({"error": "Only available in development"}), 403
    
    text = request.args.get('text', '')
    phone = request.args.get('phone', '+254712345678')
    
    response = USSDService.handle(
        session_id='test-session-001',
        service_code='*384*360#',
        phone_number=phone,
        text=text
    )
    
    return jsonify({
        "input": text,
        "response": response,
        "type": "CON" if response.startswith("CON") else "END",
        "length": len(response)
    })
