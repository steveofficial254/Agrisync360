from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.farmer import Farmer
from app.models.farm_ops import InventoryItem

inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')

@inventory_bp.route('/', methods=['POST'])
@jwt_required()
def create_inventory():
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
        
    inv = InventoryItem(
        farmer_id=farmer.id,
        item_name=data.get('item_name'),
        category=data.get('category'),
        quantity=data.get('quantity'),
        unit=data.get('unit'),
        unit_cost_ksh=data.get('unit_cost_ksh')
    )
    db.session.add(inv)
    db.session.commit()
    
    return jsonify({"success": True, "data": inv.to_dict(), "message": "Inventory added"}), 201
