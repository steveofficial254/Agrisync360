from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.ai_chat import AIConversation, AIMessage, AIChat
from app.services.ai_service import AIService
import os
from datetime import datetime

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    data = request.get_json()
    message = data.get('message')
    conversation_id = data.get('conversation_id')
    
    if not message:
        return jsonify({"success": False, "message": "Message is required"}), 400
    
    user_id = get_jwt_identity()
    
    # Get or create conversation
    if conversation_id:
        conversation = AIConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    else:
        conversation = None
    
    if not conversation:
        conversation = AIConversation(user_id=user_id, title=message[:50])
        db.session.add(conversation)
        db.session.commit()
    
    # Generate response
    response_text = AIService.generate_chat_response(message)
    
    # Save user message
    user_msg = AIMessage(conversation_id=conversation.id, role='user', content=message)
    db.session.add(user_msg)
    
    # Save assistant response
    assistant_msg = AIMessage(conversation_id=conversation.id, role='assistant', content=response_text)
    db.session.add(assistant_msg)
    
    # Also save to legacy AIChat for backward compatibility
    chat_record = AIChat(user_id=user_id, message=message, response=response_text)
    db.session.add(chat_record)
    
    db.session.commit()
    
    return jsonify({
        "success": True,
        "data": {
            "response": response_text,
            "conversation_id": str(conversation.id),
            "message_id": str(assistant_msg.id),
            "model": "mock",
            "tokens_used": 0,
            "timestamp": datetime.utcnow().isoformat()
        },
        "message": "Chat response generated"
    }), 200

@ai_bp.route('/conversations', methods=['GET'])
@jwt_required()
def list_conversations():
    user_id = get_jwt_identity()
    conversations = AIConversation.query.filter_by(user_id=user_id).order_by(AIConversation.updated_at.desc()).all()
    
    return jsonify({
        "success": True,
        "data": [conv.to_dict() for conv in conversations],
        "message": "Conversations retrieved"
    }), 200

@ai_bp.route('/conversations/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    user_id = get_jwt_identity()
    conversation = AIConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    
    if not conversation:
        return jsonify({"success": False, "message": "Conversation not found"}), 404
    
    messages = AIMessage.query.filter_by(conversation_id=conversation.id).order_by(AIMessage.created_at.asc()).all()
    
    return jsonify({
        "success": True,
        "data": {
            "conversation": conversation.to_dict(),
            "messages": [msg.to_dict() for msg in messages]
        },
        "message": "Conversation retrieved"
    }), 200

@ai_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    user_id = get_jwt_identity()
    conversation = AIConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    
    if not conversation:
        return jsonify({"success": False, "message": "Conversation not found"}), 404
    
    db.session.delete(conversation)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Conversation deleted"}), 200

@ai_bp.route('/analyze-disease', methods=['POST'])
@jwt_required()
def analyze_disease():
    data = request.get_json()
    image_base64 = data.get('image_base64')
    image_type = data.get('image_type', 'image/jpeg')
    crop_name = data.get('crop_name')
    symptoms = data.get('symptoms')
    
    # Mock response for testing
    response = {
        "success": True,
        "data": {
            "disease_detected": "fall_armyworm",
            "confidence": 0.85,
            "treatment": "Apply Coragen or Ampligo insecticide. Spray in the evening for best results.",
            "prevention": "Use resistant varieties, practice crop rotation, and monitor early signs.",
            "severity": "moderate"
        },
        "message": "Disease analysis complete"
    }
    
    return jsonify(response), 200

@ai_bp.route('/quick-answer', methods=['POST'])
def quick_answer():
    """Public endpoint for quick AI answers without authentication"""
    data = request.get_json()
    question = data.get('question')
    
    if not question:
        return jsonify({"success": False, "message": "Question is required"}), 400
    
    response_text = AIService.generate_chat_response(question)
    
    return jsonify({
        "success": True,
        "data": {
            "answer": response_text,
            "timestamp": datetime.utcnow().isoformat()
        },
        "message": "Quick answer generated"
    }), 200
