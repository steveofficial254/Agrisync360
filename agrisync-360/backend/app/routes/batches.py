from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.farmer import Farmer
from app.models.farm_ops import Batch

batches_bp = Blueprint('batches', __name__, url_prefix='/api/batches')

@batches_bp.route('/', methods=['POST'])
@jwt_required()
def create_batch():
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
        
    b = Batch(
        farmer_id=farmer.id,
        crop_name=data.get('crop_name'),
        quantity_kg=data.get('quantity_kg'),
        quality_grade=data.get('quality_grade')
    )
    db.session.add(b)
    db.session.commit()
    
    return jsonify({"success": True, "data": b.to_dict(), "message": "Batch created"}), 201
