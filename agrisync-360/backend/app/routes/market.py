from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.market import Market
from app.services.market_service import MarketService
from app.utils.decorators import admin_required

market_bp = Blueprint("market", __name__, url_prefix="/api/market")


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status

@market_bp.get("/prices")
@jwt_required()
def prices():
    return ok(MarketService.get_current_prices(request.args.get("crop"), request.args.get("county")))

@market_bp.get("/prices/all")
@jwt_required()
def prices_all():
    crops = ["maize","beans","tomatoes","potatoes"]
    return ok({c: MarketService.get_current_prices(c, request.args.get("county")) for c in crops})

@market_bp.get("/history")
@jwt_required()
def history():
    return ok(MarketService.get_price_history(request.args.get("crop"), request.args.get("months", 6)))

@market_bp.get("/profitability")
@jwt_required()
def profitability():
    return ok(MarketService.calculate_profitability(request.args.get("crop"), request.args.get("acres", 1), request.args.get("county")))

@market_bp.post("/prices")
@jwt_required()
@admin_required
def add_price():
    row = Market(**(request.get_json() or {})); db.session.add(row); db.session.commit(); return ok(row.to_dict(), "Price added", 201)

@market_bp.put("/prices/<price_id>")
@jwt_required()
@admin_required
def update_price(price_id):
    row = Market.query.get_or_404(price_id)
    for k,v in (request.get_json() or {}).items():
        if hasattr(row,k): setattr(row,k,v)
    db.session.commit(); return ok(row.to_dict(), "Price updated")
