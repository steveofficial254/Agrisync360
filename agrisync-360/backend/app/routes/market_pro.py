"""
AgriSync 360 — Market Pro Routes
Price Alerts, Buyer Directory
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.market_pro import PriceAlert, BuyerDirectory
from app.models.farmer import Farmer
import logging

logger = logging.getLogger(__name__)
market_pro_bp = Blueprint('market_pro', __name__, url_prefix='/api/market')


def get_farmer(user_id):
    return Farmer.query.filter_by(user_id=user_id).first()


# ── PRICE ALERTS ──────────────────────────────────────────

@market_pro_bp.route('/alerts', methods=['GET'])
@jwt_required()
def list_alerts():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": []}), 200

    alerts = PriceAlert.query.filter_by(
        farmer_id=farmer.id
    ).order_by(PriceAlert.created_at.desc()).all()

    return jsonify({
        "success": True,
        "data": [a.to_dict() for a in alerts]
    }), 200


@market_pro_bp.route('/alerts', methods=['POST'])
@jwt_required()
def create_alert():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    data = request.get_json()

    alert = PriceAlert(
        farmer_id=farmer.id,
        crop_name=data.get('crop_name'),
        target_price_ksh=float(data.get('target_price_ksh')),
        condition=data.get('condition', 'above'),
        county=data.get('county'),
        notify_via=data.get('notify_via', ['sms']),
    )

    db.session.add(alert)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": alert.to_dict(),
        "message": "Price alert created"
    }), 201


@market_pro_bp.route('/alerts/<alert_id>', methods=['PUT'])
@jwt_required()
def update_alert(alert_id):
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    alert = PriceAlert.query.filter_by(
        id=alert_id, farmer_id=farmer.id
    ).first()

    if not alert:
        return jsonify({
            "success": False, "message": "Alert not found"
        }), 404

    data = request.get_json()
    
    if 'is_active' in data:
        alert.is_active = data['is_active']
    if 'target_price_ksh' in data:
        alert.target_price_ksh = data['target_price_ksh']
    if 'condition' in data:
        alert.condition = data['condition']

    db.session.commit()

    return jsonify({
        "success": True,
        "data": alert.to_dict(),
        "message": "Alert updated"
    }), 200


@market_pro_bp.route('/alerts/<alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    alert = PriceAlert.query.filter_by(
        id=alert_id, farmer_id=farmer.id
    ).first()

    if not alert:
        return jsonify({
            "success": False, "message": "Not found"
        }), 404

    db.session.delete(alert)
    db.session.commit()

    return jsonify({"success": True, "message": "Alert deleted"}), 200


# ── BUYER DIRECTORY ───────────────────────────────────────

@market_pro_bp.route('/buyers', methods=['GET'])
def list_buyers():
    """Public buyer directory"""
    crop = request.args.get('crop')
    county = request.args.get('county')
    buyer_type = request.args.get('type')

    query = BuyerDirectory.query.filter_by(is_active=True)

    if crop:
        query = query.filter(
            BuyerDirectory.crops_wanted.contains([crop])
        )
    if county:
        query = query.filter(
            BuyerDirectory.counties_served.contains([county])
        )
    if buyer_type:
        query = query.filter_by(buyer_type=buyer_type)

    buyers = query.order_by(
        BuyerDirectory.is_verified.desc(),
        BuyerDirectory.business_name.asc()
    ).all()

    return jsonify({
        "success": True,
        "data": [b.to_dict() for b in buyers],
        "message": f"Found {len(buyers)} buyers"
    }), 200


@market_pro_bp.route('/buyers/<buyer_id>', methods=['GET'])
def get_buyer(buyer_id):
    """Public buyer detail"""
    buyer = BuyerDirectory.query.filter_by(
        id=buyer_id, is_active=True
    ).first()

    if not buyer:
        return jsonify({
            "success": False, "message": "Buyer not found"
        }), 404

    return jsonify({
        "success": True,
        "data": buyer.to_dict()
    }), 200
