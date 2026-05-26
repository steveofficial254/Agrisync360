from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.farmer import Farmer
from app.models.farm_ops import FarmOperation, InventoryItem, Batch, ComplianceRecord
from app.services.ai_service import AIService
from datetime import date

farm_ops_bp = Blueprint('farm_ops', __name__, url_prefix='/api/farm-ops')

@farm_ops_bp.route('/', methods=['GET'])
@jwt_required()
def list_ops():
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    op_type = request.args.get('type')
    query = FarmOperation.query.filter_by(farmer_id=farmer.id)
    
    if op_type:
        query = query.filter_by(operation_type=op_type)
    
    ops = query.order_by(FarmOperation.operation_date.desc()).all()
    
    total_cost = sum(op.cost_ksh for op in ops)
    
    return jsonify({
        "success": True,
        "data": {
            "operations": [op.to_dict() for op in ops],
            "total_cost_ksh": round(total_cost, 2)
        },
        "message": "Operations retrieved"
    }), 200

@farm_ops_bp.route('/', methods=['POST'])
@jwt_required()
def create_farm_op():
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
        
    op = FarmOperation(
        farmer_id=farmer.id,
        operation_type=data.get('operation_type'),
        operation_date=date.fromisoformat(data.get('operation_date')) if data.get('operation_date') else date.today(),
        crop_name=data.get('crop_name'),
        description=data.get('description'),
        cost_ksh=data.get('cost_ksh'),
        labor_count=data.get('labor_count'),
        duration_hours=data.get('duration_hours')
    )
    db.session.add(op)
    db.session.commit()
    
    return jsonify({"success": True, "data": op.to_dict(), "message": "Operation logged"}), 201

@farm_ops_bp.route('/ai-daily-plan', methods=['POST'])
@jwt_required()
def get_daily_plan():
    data = request.get_json()
    active_crops = data.get('active_crops', [])
    farm_size = data.get('farm_size')
    context = data.get('context', '')
    
    prompt = f"Create a daily farm plan for {farm_size} acres with crops: {', '.join(active_crops)}. {context}"
    response = AIService.generate_chat_response(prompt)
    
    return jsonify({
        "success": True,
        "data": {
            "plan": response,
            "active_crops": active_crops,
            "farm_size": farm_size
        },
        "message": "Daily plan generated"
    }), 200

# Inventory routes
inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')

@inventory_bp.route('/', methods=['GET'])
@jwt_required()
def list_inventory():
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    items = InventoryItem.query.filter_by(farmer_id=farmer.id).all()
    
    total_value = sum(item.quantity * item.unit_cost_ksh for item in items)
    low_stock_alerts = [item.to_dict() for item in items if item.minimum_stock and item.quantity < item.minimum_stock]
    
    return jsonify({
        "success": True,
        "data": {
            "items": [item.to_dict() for item in items],
            "total_value_ksh": round(total_value, 2),
            "low_stock_alerts": low_stock_alerts
        },
        "message": "Inventory retrieved"
    }), 200

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
        minimum_stock=data.get('minimum_stock'),
        unit_cost_ksh=data.get('unit_cost_ksh'),
        supplier=data.get('supplier'),
        location=data.get('location')
    )
    db.session.add(inv)
    db.session.commit()
    
    return jsonify({"success": True, "data": inv.to_dict(), "message": "Inventory added"}), 201

@inventory_bp.route('/<inv_id>/adjust', methods=['POST'])
@jwt_required()
def adjust_inventory(inv_id):
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    item = InventoryItem.query.filter_by(id=inv_id, farmer_id=farmer.id).first()
    
    if not item:
        return jsonify({"success": False, "message": "Item not found"}), 404
    
    adjustment = data.get('adjustment', 0)
    item.quantity = max(0, item.quantity + adjustment)
    db.session.commit()
    
    return jsonify({"success": True, "data": item.to_dict(), "message": "Inventory adjusted"}), 200

# Batches routes
batches_bp = Blueprint('batches', __name__, url_prefix='/api/batches')

@batches_bp.route('/', methods=['GET'])
@jwt_required()
def list_batches():
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    batches = Batch.query.filter_by(farmer_id=farmer.id).order_by(Batch.harvest_date.desc()).all()
    
    return jsonify({
        "success": True,
        "data": [batch.to_dict() for batch in batches],
        "message": "Batches retrieved"
    }), 200

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
        variety=data.get('variety'),
        harvest_date=date.fromisoformat(data.get('harvest_date')) if data.get('harvest_date') else None,
        quantity_kg=data.get('quantity_kg'),
        quality_grade=data.get('quality_grade'),
        destination=data.get('destination'),
        buyer_name=data.get('buyer_name'),
        sale_price_per_kg=data.get('sale_price_per_kg')
    )
    db.session.add(b)
    db.session.commit()
    
    return jsonify({"success": True, "data": b.to_dict(), "message": "Batch created"}), 201

@batches_bp.route('/<batch_id>/status', methods=['PUT'])
@jwt_required()
def update_batch_status(batch_id):
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    batch = Batch.query.filter_by(id=batch_id, farmer_id=farmer.id).first()
    
    if not batch:
        return jsonify({"success": False, "message": "Batch not found"}), 404
    
    batch.status = data.get('status', batch.status)
    if data.get('dispatch_date'):
        batch.dispatch_date = date.fromisoformat(data.get('dispatch_date'))
    
    db.session.commit()
    
    return jsonify({"success": True, "data": batch.to_dict(), "message": "Batch status updated"}), 200

# Compliance routes
compliance_bp = Blueprint('compliance', __name__, url_prefix='/api/compliance')

@compliance_bp.route('/', methods=['GET'])
@jwt_required()
def list_compliance():
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    records = ComplianceRecord.query.filter_by(farmer_id=farmer.id).all()
    
    expiring_soon = [rec.to_dict() for rec in records if rec.to_dict().get('is_expiring_soon')]
    
    return jsonify({
        "success": True,
        "data": {
            "records": [rec.to_dict() for rec in records],
            "expiring_soon": expiring_soon
        },
        "message": "Compliance records retrieved"
    }), 200

@compliance_bp.route('/', methods=['POST'])
@jwt_required()
def create_compliance():
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
        
    comp = ComplianceRecord(
        farmer_id=farmer.id,
        compliance_type=data.get('compliance_type'),
        certificate_number=data.get('certificate_number'),
        issuing_body=data.get('issuing_body'),
        issue_date=date.fromisoformat(data.get('issue_date')) if data.get('issue_date') else None,
        expiry_date=date.fromisoformat(data.get('expiry_date')) if data.get('expiry_date') else None,
        status=data.get('status', 'active'),
        audit_notes=data.get('audit_notes')
    )
    db.session.add(comp)
    db.session.commit()
    
    return jsonify({"success": True, "data": comp.to_dict(), "message": "Compliance record added"}), 201
