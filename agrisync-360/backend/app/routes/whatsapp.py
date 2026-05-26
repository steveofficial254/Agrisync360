from flask import Blueprint, request, jsonify

whatsapp_bp = Blueprint('whatsapp', __name__, url_prefix='/api/whatsapp')

@whatsapp_bp.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        challenge = request.args.get('hub.challenge')
        if challenge:
            return challenge, 200
        return jsonify({"success": True, "message": "Webhook registered"}), 200
    
    return jsonify({"success": True, "message": "Message received"}), 200
