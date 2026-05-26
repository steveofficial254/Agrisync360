from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.farmer import Farmer
from app.models.yield_record import YieldRecord
from app.services.ai_service import AIService
from datetime import date
import sqlalchemy as sa

yields_bp = Blueprint('yields', __name__, url_prefix='/api/yields')

@yields_bp.route('/', methods=['GET'])
@jwt_required()
def list_yields():
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    yields = YieldRecord.query.filter_by(farmer_id=farmer.id).order_by(YieldRecord.harvest_date.desc()).all()
    
    # Calculate summary
    total_revenue = sum(y.total_revenue_ksh or 0 for y in yields)
    total_cost = sum((y.seed_cost_ksh or 0) + (y.fertilizer_cost_ksh or 0) + (y.pesticide_cost_ksh or 0) + (y.labor_cost_ksh or 0) for y in yields)
    total_profit = total_revenue - total_cost
    
    return jsonify({
        "success": True,
        "data": {
            "yields": [y.to_dict() for y in yields],
            "summary": {
                "total_records": len(yields),
                "total_revenue_ksh": round(total_revenue, 2),
                "total_cost_ksh": round(total_cost, 2),
                "total_profit_ksh": round(total_profit, 2)
            }
        },
        "message": "Yields retrieved"
    }), 200

@yields_bp.route('/', methods=['POST'])
@jwt_required()
def create_yield():
    data = request.get_json()
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    generate_ai_summary = data.get('generate_ai_summary', False)
    ai_summary = None
    
    if generate_ai_summary:
        ai_summary = AIService.generate_yield_summary(
            data.get('crop_name'),
            data.get('area_planted_acres'),
            data.get('quantity_harvested_kg')
        )
        
    yr = YieldRecord(
        farmer_id=farmer.id,
        crop_name=data.get('crop_name'),
        variety=data.get('variety'),
        season=data.get('season'),
        area_planted_acres=data.get('area_planted_acres'),
        quantity_harvested_kg=data.get('quantity_harvested_kg'),
        quantity_sold_kg=data.get('quantity_sold_kg'),
        price_per_kg=data.get('price_per_kg'),
        total_revenue_ksh=data.get('total_revenue_ksh'),
        seed_cost_ksh=data.get('seed_cost_ksh'),
        fertilizer_cost_ksh=data.get('fertilizer_cost_ksh'),
        pesticide_cost_ksh=data.get('pesticide_cost_ksh'),
        labor_cost_ksh=data.get('labor_cost_ksh'),
        harvest_date=date.fromisoformat(data.get('harvest_date')) if data.get('harvest_date') else None,
        planting_date=date.fromisoformat(data.get('planting_date')) if data.get('planting_date') else None,
        challenges_faced=data.get('challenges_faced'),
        ai_summary=ai_summary
    )
    db.session.add(yr)
    db.session.commit()
    
    return jsonify({"success": True, "data": yr.to_dict(), "message": "Yield recorded"}), 201

@yields_bp.route('/<yield_id>', methods=['GET'])
@jwt_required()
def get_yield(yield_id):
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    yield_rec = YieldRecord.query.filter_by(id=yield_id, farmer_id=farmer.id).first()
    
    if not yield_rec:
        return jsonify({"success": False, "message": "Yield record not found"}), 404
    
    return jsonify({"success": True, "data": yield_rec.to_dict(), "message": "Yield retrieved"}), 200

@yields_bp.route('/<yield_id>/regenerate-summary', methods=['POST'])
@jwt_required()
def regenerate_summary(yield_id):
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    yield_rec = YieldRecord.query.filter_by(id=yield_id, farmer_id=farmer.id).first()
    
    if not yield_rec:
        return jsonify({"success": False, "message": "Yield record not found"}), 404
    
    # Generate new AI summary
    ai_summary = AIService.generate_yield_summary(
        yield_rec.crop_name,
        yield_rec.area_planted_acres,
        yield_rec.quantity_harvested_kg
    )
    
    yield_rec.ai_summary = ai_summary
    db.session.commit()
    
    return jsonify({"success": True, "data": yield_rec.to_dict(), "message": "Summary regenerated"}), 200

@yields_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    user_id = get_jwt_identity()
    farmer = Farmer.query.filter_by(user_id=user_id).first()
    
    if not farmer:
        return jsonify({"success": False, "message": "Farmer profile required"}), 404
    
    yields = YieldRecord.query.filter_by(farmer_id=farmer.id).all()
    
    # Group by crop
    by_crop = {}
    for y in yields:
        if y.crop_name not in by_crop:
            by_crop[y.crop_name] = {
                "count": 0,
                "total_yield_kg": 0,
                "total_revenue_ksh": 0,
                "avg_yield_per_acre": 0
            }
        by_crop[y.crop_name]["count"] += 1
        by_crop[y.crop_name]["total_yield_kg"] += y.quantity_harvested_kg or 0
        by_crop[y.crop_name]["total_revenue_ksh"] += y.total_revenue_ksh or 0
        by_crop[y.crop_name]["avg_yield_per_acre"] = (y.quantity_harvested_kg or 0) / (y.area_planted_acres or 1)
    
    # Calculate averages
    for crop in by_crop:
        by_crop[crop]["avg_yield_per_acre"] = round(by_crop[crop]["avg_yield_per_acre"], 2)
    
    return jsonify({
        "success": True,
        "data": {
            "by_crop": by_crop,
            "total_records": len(yields)
        },
        "message": "Analytics retrieved"
    }), 200
