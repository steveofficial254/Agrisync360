from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.farmer import Farmer
from app.models.greenhouse import Greenhouse, GreenhouseReading
from app.services.ai_service import AIService
from datetime import date

greenhouse_bp = Blueprint('greenhouse', __name__, url_prefix='/api/greenhouse')

@greenhouse_bp.route('/', methods=['GET'])
@jwt_required()
def list_greenhouses():
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    greenhouses = Greenhouse.query.filter_by(farmer_id=farmer.id).order_by(Greenhouse.created_at.desc()).all()
    
    return jsonify({
        "success": True,
        "data": [gh.to_dict() for gh in greenhouses],
        "message": "Greenhouses retrieved"
    }), 200

@greenhouse_bp.route('/', methods=['POST'])
@jwt_required()
def create_greenhouse():
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
        
    gh = Greenhouse(
        farmer_id=farmer.id,
        name=data.get('name'),
        greenhouse_type=data.get('greenhouse_type'),
        length_meters=data.get('length_meters'),
        width_meters=data.get('width_meters'),
        height_meters=data.get('height_meters'),
        covering_material=data.get('covering_material'),
        irrigation_system=data.get('irrigation_system'),
        current_crop=data.get('current_crop'),
        planting_date=date.fromisoformat(data.get('planting_date')) if data.get('planting_date') else None
    )
    db.session.add(gh)
    db.session.commit()
    
    return jsonify({"success": True, "data": gh.to_dict(), "message": "Greenhouse created"}), 201

@greenhouse_bp.route('/<gh_id>', methods=['GET'])
@jwt_required()
def get_greenhouse(gh_id):
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    greenhouse = Greenhouse.query.filter_by(id=gh_id, farmer_id=farmer.id).first()
    
    if not greenhouse:
        return jsonify({"success": False, "message": "Greenhouse not found"}), 404
    
    return jsonify({"success": True, "data": greenhouse.to_dict(), "message": "Greenhouse retrieved"}), 200

@greenhouse_bp.route('/<gh_id>', methods=['PUT'])
@jwt_required()
def update_greenhouse(gh_id):
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    greenhouse = Greenhouse.query.filter_by(id=gh_id, farmer_id=farmer.id).first()
    
    if not greenhouse:
        return jsonify({"success": False, "message": "Greenhouse not found"}), 404
    
    # Update fields
    if data.get('name'):
        greenhouse.name = data.get('name')
    if data.get('current_crop'):
        greenhouse.current_crop = data.get('current_crop')
    if data.get('planting_date'):
        greenhouse.planting_date = date.fromisoformat(data.get('planting_date'))
    
    db.session.commit()
    
    return jsonify({"success": True, "data": greenhouse.to_dict(), "message": "Greenhouse updated"}), 200

@greenhouse_bp.route('/<gh_id>/readings', methods=['POST'])
@jwt_required()
def add_reading(gh_id):
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    greenhouse = Greenhouse.query.filter_by(id=gh_id, farmer_id=farmer.id).first()
    
    if not greenhouse:
        return jsonify({"success": False, "message": "Greenhouse not found"}), 404
    
    data = request.get_json()
    reading = GreenhouseReading(
        greenhouse_id=gh_id,
        temperature_celsius=data.get('temperature_celsius'),
        humidity_percent=data.get('humidity_percent'),
        ph_level=data.get('ph_level'),
        ec_level=data.get('ec_level'),
        soil_moisture_percent=data.get('soil_moisture_percent')
    )
    db.session.add(reading)
    db.session.commit()
    
    return jsonify({"success": True, "data": reading.to_dict(), "message": "Reading added"}), 201

@greenhouse_bp.route('/<gh_id>/ai-advice', methods=['POST'])
@jwt_required()
def get_ai_advice(gh_id):
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    greenhouse = Greenhouse.query.filter_by(id=gh_id, farmer_id=farmer.id).first()
    
    if not greenhouse:
        return jsonify({"success": False, "message": "Greenhouse not found"}), 404
    
    data = request.get_json()
    question = data.get('question', '')
    
    # Get latest reading
    latest_reading = GreenhouseReading.query.filter_by(greenhouse_id=gh_id).order_by(GreenhouseReading.created_at.desc()).first()
    
    context = f"Greenhouse with {greenhouse.current_crop or 'no crop'}"
    if latest_reading:
        context += f". Current conditions: {latest_reading.temperature_celsius}°C, {latest_reading.humidity_percent}% humidity"
    
    response = AIService.generate_chat_response(f"{question}. Context: {context}")
    
    return jsonify({
        "success": True,
        "data": {
            "advice": response,
            "greenhouse_context": greenhouse.to_dict(),
            "latest_reading": latest_reading.to_dict() if latest_reading else None
        },
        "message": "AI advice generated"
    }), 200
