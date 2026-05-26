"""
AgriSync 360 — Farm Intelligence Routes
Planting Calendar, Soil Health, Irrigation, Pest Library
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.farm_intelligence import (
    PlantingCalendarEntry, SoilHealthRecord,
    IrrigationSchedule, PestDiseaseEntry
)
from app.models.farmer import Farmer
from app.services.ai_service import AIService
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)
farm_intel_bp = Blueprint('farm_intel', __name__, url_prefix='/api')


def get_farmer(user_id):
    return Farmer.query.filter_by(user_id=user_id).first()


# ── PLANTING CALENDAR ─────────────────────────────────────

@farm_intel_bp.route('/calendar/', methods=['GET'])
@jwt_required()
def list_calendar():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": []}), 200

    month = request.args.get('month')
    year = request.args.get('year')
    status = request.args.get('status')

    query = PlantingCalendarEntry.query.filter_by(
        farmer_id=farmer.id
    )

    if status:
        query = query.filter_by(status=status)

    entries = query.order_by(
        PlantingCalendarEntry.planned_planting_date.asc()
    ).all()

    # Upcoming this week
    today = date.today()
    week_ahead = today + timedelta(days=7)
    upcoming = [
        e for e in entries
        if e.planned_planting_date and
        today <= e.planned_planting_date <= week_ahead and
        e.status == 'planned'
    ]

    return jsonify({
        "success": True,
        "data": {
            "entries": [e.to_dict() for e in entries],
            "upcoming_this_week": [e.to_dict() for e in upcoming],
            "total": len(entries),
            "by_status": {
                "planned": sum(1 for e in entries
                               if e.status == 'planned'),
                "planted": sum(1 for e in entries
                                if e.status == 'planted'),
                "growing": sum(1 for e in entries
                                if e.status == 'growing'),
                "harvested": sum(1 for e in entries
                                  if e.status == 'harvested'),
            }
        }
    }), 200


@farm_intel_bp.route('/calendar/', methods=['POST'])
@jwt_required()
def create_calendar_entry():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({
            "success": False,
            "message": "Complete your profile first"
        }), 400

    data = request.get_json()

    if not data.get('crop_name') or not data.get('planned_planting_date'):
        return jsonify({
            "success": False,
            "message": "crop_name and planned_planting_date required"
        }), 400

    entry = PlantingCalendarEntry(
        farmer_id=farmer.id,
        crop_name=data['crop_name'],
        variety=data.get('variety'),
        farm_id=data.get('farm_id'),
        planned_planting_date=data['planned_planting_date'],
        planned_harvest_date=data.get('planned_harvest_date'),
        area_acres=float(data.get('area_acres', 1)),
        status=data.get('status', 'planned'),
        notes=data.get('notes'),
        color=data.get('color', '#2D6A4F'),
    )

    db.session.add(entry)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": entry.to_dict(),
        "message": "Calendar entry created"
    }), 201


@farm_intel_bp.route('/calendar/<entry_id>', methods=['PUT'])
@jwt_required()
def update_calendar_entry(entry_id):
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    entry = PlantingCalendarEntry.query.filter_by(
        id=entry_id, farmer_id=farmer.id
    ).first()

    if not entry:
        return jsonify({
            "success": False, "message": "Entry not found"
        }), 404

    data = request.get_json()
    fields = ['crop_name', 'variety', 'planned_planting_date',
              'actual_planting_date', 'planned_harvest_date',
              'actual_harvest_date', 'area_acres', 'status',
              'notes', 'color']

    for field in fields:
        if field in data:
            setattr(entry, field, data[field])

    db.session.commit()

    return jsonify({
        "success": True,
        "data": entry.to_dict(),
        "message": "Entry updated"
    }), 200


@farm_intel_bp.route('/calendar/<entry_id>', methods=['DELETE'])
@jwt_required()
def delete_calendar_entry(entry_id):
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    entry = PlantingCalendarEntry.query.filter_by(
        id=entry_id, farmer_id=farmer.id
    ).first()

    if not entry:
        return jsonify({
            "success": False, "message": "Not found"
        }), 404

    db.session.delete(entry)
    db.session.commit()

    return jsonify({"success": True, "message": "Deleted"}), 200


# ── SOIL HEALTH ────────────────────────────────────────────

@farm_intel_bp.route('/soil/', methods=['GET'])
@jwt_required()
def list_soil_records():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": []}), 200

    records = SoilHealthRecord.query.filter_by(
        farmer_id=farmer.id
    ).order_by(SoilHealthRecord.test_date.desc()).all()

    latest = records[0].to_dict() if records else None

    return jsonify({
        "success": True,
        "data": {
            "records": [r.to_dict() for r in records],
            "latest": latest,
            "total": len(records),
        }
    }), 200


@farm_intel_bp.route('/soil/', methods=['POST'])
@jwt_required()
def add_soil_record():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({
            "success": False,
            "message": "Profile required"
        }), 400

    data = request.get_json()

    record = SoilHealthRecord(
        farmer_id=farmer.id,
        farm_id=data.get('farm_id'),
        test_date=data.get('test_date', date.today().isoformat()),
        lab_name=data.get('lab_name'),
        ph_level=data.get('ph_level'),
        nitrogen_ppm=data.get('nitrogen_ppm'),
        phosphorus_ppm=data.get('phosphorus_ppm'),
        potassium_ppm=data.get('potassium_ppm'),
        organic_matter_percent=data.get('organic_matter_percent'),
        calcium_ppm=data.get('calcium_ppm'),
        magnesium_ppm=data.get('magnesium_ppm'),
        zinc_ppm=data.get('zinc_ppm'),
        boron_ppm=data.get('boron_ppm'),
        soil_texture=data.get('soil_texture'),
        water_retention=data.get('water_retention'),
        recommendations=data.get('recommendations'),
        next_test_date=data.get('next_test_date'),
    )

    # Auto generate AI recommendations
    if data.get('get_ai_recommendations', True):
        soil_data_text = f"""
pH: {data.get('ph_level')}
Nitrogen (N): {data.get('nitrogen_ppm')} ppm
Phosphorus (P): {data.get('phosphorus_ppm')} ppm
Potassium (K): {data.get('potassium_ppm')} ppm
Organic Matter: {data.get('organic_matter_percent')}%
Soil Texture: {data.get('soil_texture')}
County: {farmer.county}
"""
        ai_result = AIService.generate_chat_response(
            f"""Based on these soil test results for a 
farm in {farmer.county}, Kenya, provide specific fertilizer 
and soil amendment recommendations:
{soil_data_text}
Include: lime requirements, fertilizer types and rates,
organic matter recommendations, and crops best suited
for these soil conditions. Be specific with product names
available in Kenya."""
        )
        if ai_result:
            record.ai_recommendations = ai_result

    db.session.add(record)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": record.to_dict(),
        "message": "Soil record added with AI recommendations"
    }), 201


# ── IRRIGATION MANAGER ─────────────────────────────────────

@farm_intel_bp.route('/irrigation/', methods=['GET'])
@jwt_required()
def list_irrigation():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": []}), 200

    upcoming = request.args.get('upcoming', 'false') == 'true'

    query = IrrigationSchedule.query.filter_by(farmer_id=farmer.id)

    if upcoming:
        today = date.today()
        query = query.filter(
            IrrigationSchedule.scheduled_date >= today,
            IrrigationSchedule.status == 'scheduled'
        )

    schedules = query.order_by(
        IrrigationSchedule.scheduled_date.asc()
    ).all()

    total_water = sum(
        s.water_amount_litres or 0 for s in schedules
        if s.status == 'completed'
    )
    total_cost = sum(
        s.cost_ksh or 0 for s in schedules
        if s.status == 'completed'
    )

    return jsonify({
        "success": True,
        "data": {
            "schedules": [s.to_dict() for s in schedules],
            "total_water_litres": total_water,
            "total_cost_ksh": total_cost,
            "upcoming_count": sum(
                1 for s in schedules
                if s.status == 'scheduled'
            ),
        }
    }), 200


@farm_intel_bp.route('/irrigation/', methods=['POST'])
@jwt_required()
def create_irrigation():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    data = request.get_json()

    schedule = IrrigationSchedule(
        farmer_id=farmer.id,
        farm_id=data.get('farm_id'),
        crop_name=data.get('crop_name'),
        irrigation_type=data.get('irrigation_type', 'drip'),
        water_source=data.get('water_source'),
        scheduled_date=data['scheduled_date'],
        scheduled_time=data.get('scheduled_time'),
        duration_minutes=data.get('duration_minutes'),
        water_amount_litres=data.get('water_amount_litres'),
        area_irrigated_acres=data.get('area_irrigated_acres'),
        cost_ksh=data.get('cost_ksh', 0),
        notes=data.get('notes'),
    )

    db.session.add(schedule)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": schedule.to_dict(),
        "message": "Irrigation scheduled"
    }), 201


@farm_intel_bp.route('/irrigation/<schedule_id>/complete',
                     methods=['POST'])
@jwt_required()
def complete_irrigation(schedule_id):
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    schedule = IrrigationSchedule.query.filter_by(
        id=schedule_id, farmer_id=farmer.id
    ).first()

    if not schedule:
        return jsonify({
            "success": False, "message": "Not found"
        }), 404

    data = request.get_json() or {}
    schedule.status = 'completed'
    schedule.actual_date = data.get('actual_date', date.today().isoformat())
    if data.get('water_amount_litres'):
        schedule.water_amount_litres = data['water_amount_litres']
    if data.get('notes'):
        schedule.notes = data['notes']

    db.session.commit()

    return jsonify({
        "success": True,
        "data": schedule.to_dict(),
        "message": "Irrigation marked complete"
    }), 200


# ── PEST & DISEASE LIBRARY ────────────────────────────────

@farm_intel_bp.route('/pest-library/', methods=['GET'])
def search_pest_library():
    """Public searchable pest and disease database"""
    search = request.args.get('search', '').strip()
    crop = request.args.get('crop', '').strip()
    pest_type = request.args.get('type', '').strip()
    severity = request.args.get('severity', '').strip()

    query = PestDiseaseEntry.query.filter_by(is_active=True)

    if search:
        query = query.filter(
            db.or_(
                PestDiseaseEntry.name.ilike(f'%{search}%'),
                PestDiseaseEntry.local_name.ilike(f'%{search}%'),
                PestDiseaseEntry.symptoms.ilike(f'%{search}%'),
            )
        )
    if crop:
        query = query.filter(
            PestDiseaseEntry.affected_crops.contains([crop])
        )
    if pest_type:
        query = query.filter_by(type=pest_type)
    if severity:
        query = query.filter_by(severity=severity)

    entries = query.order_by(
        PestDiseaseEntry.severity.desc(),
        PestDiseaseEntry.name.asc()
    ).all()

    return jsonify({
        "success": True,
        "data": [e.to_dict() for e in entries],
        "message": f"Found {len(entries)} entries"
    }), 200


@farm_intel_bp.route('/pest-library/<entry_id>', methods=['GET'])
def get_pest_entry(entry_id):
    entry = PestDiseaseEntry.query.filter_by(
        id=entry_id, is_active=True
    ).first()

    if not entry:
        return jsonify({
            "success": False, "message": "Not found"
        }), 404

    return jsonify({
        "success": True,
        "data": entry.to_dict()
    }), 200
