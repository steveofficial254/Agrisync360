from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.extensions import db
from app.models.market import Market
from app.models.farmer import Farmer
from app.services.market_service import MarketService
from app.utils.decorators import admin_required, subscription_required

market_bp = Blueprint("market", __name__, url_prefix="/api/market")


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


logger = logging.getLogger(__name__)


@market_bp.get("/prices")
def prices():
    """Public endpoint - get current market prices with optional filters"""
    try:
        crop = request.args.get("crop")
        county = request.args.get("county")
        
        prices = MarketService.get_current_prices(crop_name=crop, county=county)
        
        return jsonify({
            "success": True,
            "data": prices,
            "message": "Market prices retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Get prices error: {str(e)}")
        return err("server_error", "Failed to retrieve market prices", 500)


@market_bp.get("/prices/all")
@jwt_required()
@subscription_required('basic')
def prices_all():
    """JWT required - returns prices for all crops in farmer's county"""
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        county = farmer.county
        all_prices = MarketService.get_current_prices(county=county)
        
        # Group by crop name
        prices_by_crop = {}
        for price_data in all_prices:
            crop = price_data["crop_name"]
            if crop not in prices_by_crop:
                prices_by_crop[crop] = []
            prices_by_crop[crop].append(price_data)
        
        return jsonify({
            "success": True,
            "data": prices_by_crop,
            "message": "All market prices retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Get all prices error: {str(e)}")
        return err("server_error", "Failed to retrieve market prices", 500)


@market_bp.get("/history")
def history():
    """Public endpoint - get monthly price history for charting"""
    try:
        crop = request.args.get("crop")
        if not crop:
            return err("validation_error", "crop parameter is required", 400)
        
        months = int(request.args.get("months", 3))
        history = MarketService.get_price_history(crop_name=crop, months=months)
        
        return jsonify({
            "success": True,
            "data": history,
            "message": "Price history retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Get history error: {str(e)}")
        return err("server_error", "Failed to retrieve price history", 500)


@market_bp.get("/profitability")
@jwt_required()
@subscription_required('basic')
def profitability():
    """JWT required - calculate profitability for crop in farmer's county"""
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        crop = request.args.get("crop")
        acres = request.args.get("acres")
        county = request.args.get("county") or farmer.county
        
        if not crop:
            return err("validation_error", "crop parameter is required", 400)
        
        if not acres:
            return err("validation_error", "acres parameter is required", 400)
        
        if not county:
            return err("validation_error", "county parameter is required (or complete your profile)", 400)
        
        try:
            acres = float(acres)
            if acres <= 0 or acres > 1000:
                return err("validation_error", "acres must be between 0 and 1000", 400)
        except (ValueError, TypeError):
            return err("validation_error", "acres must be a valid number", 400)
        
        profitability = MarketService.calculate_profitability(
            crop_name=crop, 
            acres=acres, 
            county=county
        )
        
        if "error" in profitability:
            return err("server_error", profitability["error"], 500)
        
        return jsonify({
            "success": True,
            "data": profitability,
            "message": "Profitability analysis completed successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Calculate profitability error: {str(e)}")
        return err("server_error", "Failed to calculate profitability", 500)


@market_bp.post("/prices")
@jwt_required()
@admin_required
def add_price():
    """Admin only - add new price record manually"""
    try:
        payload = request.get_json() or {}
        
        # Validate required fields
        required_fields = ["crop_name", "county", "market_name", "price_per_kg", "recorded_date"]
        for field in required_fields:
            if field not in payload:
                return err("validation_error", f"Missing required field: {field}", 400)
        
        # Validate price
        try:
            price = float(payload["price_per_kg"])
            if price <= 0:
                return err("validation_error", "price_per_kg must be positive", 400)
        except (ValueError, TypeError):
            return err("validation_error", "price_per_kg must be a valid number", 400)
        
        # Validate date
        try:
            from datetime import datetime
            recorded_date = datetime.strptime(payload["recorded_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return err("validation_error", "recorded_date must be in YYYY-MM-DD format", 400)
        
        # Create price record
        price_record = Market(
            crop_name=payload["crop_name"],
            county=payload["county"],
            market_name=payload["market_name"],
            price_per_kg=price,
            unit=payload.get("unit", "kg"),
            price_per_unit=price,
            demand_level=payload.get("demand_level", "medium"),
            source=payload.get("source", "Manual entry"),
            recorded_date=recorded_date
        )
        
        db.session.add(price_record)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": price_record.to_dict(),
            "message": "Price record added successfully"
        }), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Add price error: {str(e)}")
        return err("server_error", "Failed to add price record", 500)
    except Exception as e:
        logger.error(f"Add price error: {str(e)}")
        return err("server_error", "Failed to add price record", 500)
