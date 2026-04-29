from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_, or_
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import logging

from app.extensions import db
from app.models.user import User
from app.models.farmer import Farmer
from app.models.agro_dealer import AgroDealer, ProductRecommendation
from app.utils.decorators import agro_dealer_required
from app.services.sms_service import SMSService

agro_dealer_bp = Blueprint("agro_dealer", __name__, url_prefix="/api/dealer")


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


logger = logging.getLogger(__name__)


@agro_dealer_bp.get("/profile")
@jwt_required()
@agro_dealer_required()
def get_profile():
    """Get agro-dealer business profile"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        return ok(dealer.to_dict(), "Profile retrieved successfully")
        
    except Exception as e:
        logger.error(f"Get dealer profile error: {str(e)}")
        return err("server_error", "Failed to retrieve profile", 500)


@agro_dealer_bp.post("/profile")
@jwt_required()
@agro_dealer_required()
def create_profile():
    """Create agro-dealer profile"""
    try:
        current_user_id = get_jwt_identity()
        payload = request.get_json() or {}
        
        # Validate required fields
        required_fields = ["business_name", "county"]
        for field in required_fields:
            if field not in payload:
                return err("validation_error", f"Missing required field: {field}", 400)
        
        # Check if profile already exists
        existing = AgroDealer.query.filter_by(user_id=current_user_id).first()
        if existing:
            return err("duplicate", "Profile already exists", 409)
        
        # Create dealer profile
        dealer = AgroDealer(
            user_id=current_user_id,
            business_name=payload["business_name"],
            business_location=payload.get("business_location", ""),
            county=payload["county"],
            products=payload.get("products", []),
            is_verified=False
        )
        
        db.session.add(dealer)
        db.session.commit()
        
        return ok(dealer.to_dict(), "Profile created successfully", 201)
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Create dealer profile error: {str(e)}")
        return err("server_error", "Failed to create profile", 500)
    except Exception as e:
        logger.error(f"Create dealer profile error: {str(e)}")
        return err("server_error", "Failed to create profile", 500)


@agro_dealer_bp.put("/profile")
@jwt_required()
@agro_dealer_required()
def update_profile():
    """Update agro-dealer profile"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        payload = request.get_json() or {}
        
        # Update fields
        for field in ["business_name", "business_location", "county", "products"]:
            if field in payload:
                setattr(dealer, field, payload[field])
        
        db.session.commit()
        
        return ok(dealer.to_dict(), "Profile updated successfully")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Update dealer profile error: {str(e)}")
        return err("server_error", "Failed to update profile", 500)
    except Exception as e:
        logger.error(f"Update dealer profile error: {str(e)}")
        return err("server_error", "Failed to update profile", 500)


@agro_dealer_bp.get("/stats")
@jwt_required()
@agro_dealer_required()
def get_stats():
    """Get dealer statistics"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        # Count products
        products_count = ProductRecommendation.query.filter_by(agro_dealer_id=dealer.id).count()
        
        # Count farmers in dealer's county
        farmers_count = Farmer.query.filter_by(county=dealer.county).count()
        
        # Get top products
        top_products = db.session.query(
            ProductRecommendation.product_name,
            func.count(ProductRecommendation.id).label('recommendations')
        ).filter_by(agro_dealer_id=dealer.id)\
         .group_by(ProductRecommendation.product_name)\
         .order_by(func.count(ProductRecommendation.id).desc())\
         .limit(5).all()
        
        # Get active counties (simplified)
        counties_active = [dealer.county] if dealer.county else []
        
        stats = {
            "farmers_reached": farmers_count,
            "products_listed": products_count,
            "recommendations_sent": products_count,  # Simplified - actual would need tracking
            "counties_active": counties_active,
            "top_products": [
                {"product_name": p.product_name, "recommendations": p.recommendations}
                for p in top_products
            ]
        }
        
        return ok(stats, "Statistics retrieved successfully")
        
    except Exception as e:
        logger.error(f"Get dealer stats error: {str(e)}")
        return err("server_error", "Failed to retrieve statistics", 500)


@agro_dealer_bp.get("/farmers")
@jwt_required()
@agro_dealer_required()
def get_farmers():
    """List farmers in dealer's county"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        # Query parameters
        crop_filter = request.args.get("crop")
        subscription_filter = request.args.get("subscription")
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 100)
        
        # Build query
        query = Farmer.query.filter_by(county=dealer.county)
        
        if crop_filter:
            query = query.join(Farmer.user).join(Farmer.farms).join(Farmer.crops).filter(
                Farmer.crops.any(crop_name=crop_filter)
            )
        
        if subscription_filter:
            from app.models.payment import Payment
            query = query.join(Payment).filter(
                Payment.status == 'completed',
                Payment.subscription_end >= datetime.utcnow().date()
            )
        
        # Paginate
        pg = query.paginate(page=page, per_page=per_page, error_out=False)
        
        farmers_data = []
        for farmer in pg.items:
            farmers_data.append({
                "id": str(farmer.id),
                "first_name": farmer.first_name,
                "last_name": farmer.last_name,
                "phone": farmer.phone,
                "county": farmer.county,
                "sub_county": farmer.sub_county,
                "created_at": farmer.created_at.isoformat() if farmer.created_at else None,
                "subscription_status": "active" if subscription_filter else "unknown"
            })
        
        return jsonify({
            "success": True,
            "data": {
                "items": farmers_data,
                "total": pg.total,
                "page": page,
                "per_page": per_page,
                "pages": pg.pages
            },
            "message": "Farmers retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Get farmers error: {str(e)}")
        return err("server_error", "Failed to retrieve farmers", 500)


@agro_dealer_bp.post("/products")
@jwt_required()
@agro_dealer_required()
def add_product():
    """Add product recommendation"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        payload = request.get_json() or {}
        
        # Validate required fields
        required_fields = ["crop_name", "product_name", "product_type", "price_ksh"]
        for field in required_fields:
            if field not in payload:
                return err("validation_error", f"Missing required field: {field}", 400)
        
        # Validate price
        try:
            price = float(payload["price_ksh"])
            if price <= 0:
                return err("validation_error", "price_ksh must be positive", 400)
        except (ValueError, TypeError):
            return err("validation_error", "price_ksh must be a valid number", 400)
        
        # Create product recommendation
        product = ProductRecommendation(
            agro_dealer_id=dealer.id,
            crop_name=payload["crop_name"],
            product_name=payload["product_name"],
            product_type=payload["product_type"],
            description=payload.get("description", ""),
            price_ksh=price,
            available=True
        )
        
        db.session.add(product)
        db.session.commit()
        
        return ok(product.to_dict(), "Product added successfully", 201)
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Add product error: {str(e)}")
        return err("server_error", "Failed to add product", 500)
    except Exception as e:
        logger.error(f"Add product error: {str(e)}")
        return err("server_error", "Failed to add product", 500)


@agro_dealer_bp.get("/products")
@jwt_required()
@agro_dealer_required()
def get_products():
    """List dealer's products"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        products = ProductRecommendation.query.filter_by(agro_dealer_id=dealer.id).all()
        
        return ok([p.to_dict() for p in products], "Products retrieved successfully")
        
    except Exception as e:
        logger.error(f"Get products error: {str(e)}")
        return err("server_error", "Failed to retrieve products", 500)


@agro_dealer_bp.put("/products/<product_id>")
@jwt_required()
@agro_dealer_required()
def update_product(product_id):
    """Update product recommendation"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        product = ProductRecommendation.query.filter_by(
            agro_dealer_id=dealer.id, id=product_id
        ).first()
        
        if not product:
            return err("not_found", "Product not found", 404)
        
        payload = request.get_json() or {}
        
        # Update fields
        for field in ["product_name", "description", "price_ksh", "available"]:
            if field in payload:
                if field == "price_ksh":
                    try:
                        price = float(payload[field])
                        if price <= 0:
                            return err("validation_error", "price_ksh must be positive", 400)
                        setattr(product, field, price)
                    except (ValueError, TypeError):
                        return err("validation_error", "price_ksh must be a valid number", 400)
                else:
                    setattr(product, field, payload[field])
        
        db.session.commit()
        
        return ok(product.to_dict(), "Product updated successfully")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Update product error: {str(e)}")
        return err("server_error", "Failed to update product", 500)
    except Exception as e:
        logger.error(f"Update product error: {str(e)}")
        return err("server_error", "Failed to update product", 500)


@agro_dealer_bp.delete("/products/<product_id>")
@jwt_required()
@agro_dealer_required()
def delete_product(product_id):
    """Remove product recommendation"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        product = ProductRecommendation.query.filter_by(
            agro_dealer_id=dealer.id, id=product_id
        ).first()
        
        if not product:
            return err("not_found", "Product not found", 404)
        
        db.session.delete(product)
        db.session.commit()
        
        return ok({}, "Product deleted successfully")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Delete product error: {str(e)}")
        return err("server_error", "Failed to delete product", 500)
    except Exception as e:
        logger.error(f"Delete product error: {str(e)}")
        return err("server_error", "Failed to delete product", 500)


@agro_dealer_bp.post("/broadcast")
@jwt_required()
@agro_dealer_required()
def broadcast():
    """Send product advisory to farmers in county"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        payload = request.get_json() or {}
        
        # Validate required fields
        if "crop" not in payload or "message" not in payload:
            return err("validation_error", "crop and message are required", 400)
        
        crop = payload["crop"]
        message = payload["message"]
        segment = payload.get("segment", "all")
        
        # Build farmer query
        query = Farmer.query.filter_by(county=dealer.county)
        
        # Filter by crop if specified
        if crop != "all":
            query = query.join(Farmer.farms).join(Farmer.crops).filter(
                Farmer.crops.any(crop_name=crop)
            )
        
        # Filter by segment
        if segment.startswith("county:"):
            county = segment.replace("county:", "")
            query = query.filter_by(sub_county=county)
        
        farmers = query.all()
        
        sent_count = 0
        failed_count = 0
        
        for farmer in farmers:
            try:
                # Send SMS
                SMSService.send_sms(
                    farmer.phone,
                    message,
                    'product_advisory',
                    farmer.id
                )
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send SMS to {farmer.phone}: {str(e)}")
                failed_count += 1
        
        return ok({
            "sent": sent_count,
            "failed": failed_count,
            "total": len(farmers),
            "message": f"Broadcast sent to {sent_count} farmers"
        }, "Broadcast completed")
        
    except Exception as e:
        logger.error(f"Broadcast error: {str(e)}")
        return err("server_error", "Failed to send broadcast", 500)


@agro_dealer_bp.get("/recommendations/analytics")
@jwt_required()
@agro_dealer_required()
def recommendations_analytics():
    """Get product recommendation analytics"""
    try:
        current_user_id = get_jwt_identity()
        dealer = AgroDealer.query.filter_by(user_id=current_user_id).first()
        
        if not dealer:
            return err("not_found", "Agro-dealer profile not found", 404)
        
        # Get product views and engagement (simplified)
        products = db.session.query(
            ProductRecommendation.product_name,
            func.count(ProductRecommendation.id).label('views'),
            ProductRecommendation.available
        ).filter_by(agro_dealer_id=dealer.id)\
         .group_by(ProductRecommendation.product_name)\
         .order_by(func.count(ProductRecommendation.id).desc())\
         .all()
        
        analytics = {
            "total_products": len(products),
            "available_products": len([p for p in products if p.available]),
            "top_viewed": [
                {
                    "product_name": p.product_name,
                    "views": p.views,
                    "available": p.available
                } for p in products[:5]
            ]
        }
        
        return ok(analytics, "Analytics retrieved successfully")
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        return err("server_error", "Failed to retrieve analytics", 500)
