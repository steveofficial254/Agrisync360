from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import logging

from app.extensions import db
from app.models.farmer import Farmer
from app.models.user import User
from app.models.payment import Payment
from app.utils.decorators import admin_required
from app.schemas.farmer_schema import FarmerProfileSchema, FarmerCreateSchema

farmers_bp = Blueprint("farmers", __name__, url_prefix="/api/farmers")


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


logger = logging.getLogger(__name__)

# Valid Kenyan counties
KENYAN_COUNTIES = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta",
    "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka Nithi",
    "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga",
    "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia",
    "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru",
    "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma",
    "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira",
    "Nairobi City"
]


@farmers_bp.get("/profile")
@jwt_required()
def get_profile():
    try:
        farmer = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if not farmer:
            # Return empty profile instead of 404
            return jsonify({
                "success": True,
                "data": {
                    "id": None,
                    "first_name": "",
                    "last_name": "",
                    "county": "",
                    "sub_county": "",
                    "ward": "",
                    "village": "",
                    "national_id": "",
                    "profile_photo": None,
                    "phone": "",
                    "farms": [],
                    "active_crops": [],
                    "profile_complete": False,
                    "message": "Please complete your profile to access all features"
                },
                "message": "Profile data retrieved (incomplete)"
            }), 200
        
        # Get farms and active crops
        farms_data = []
        active_crops = []
        
        for farm in farmer.farms.filter_by(is_deleted=False):
            farms_data.append(farm.to_dict())
            for crop in farm.crop_subscriptions.filter_by(is_active=True):
                crop_data = crop.to_dict()
                crop_data['farm_name'] = farm.name
                active_crops.append(crop_data)
        
        # Get subscription status
        from datetime import date
        today = date.today()
        active_payment = Payment.query.filter_by(
            farmer_id=farmer.id,
            status='completed'
        ).filter(
            Payment.subscription_end >= today
        ).order_by(Payment.subscription_end.desc()).first()
        
        subscription = None
        if active_payment:
            subscription = {
                "plan": active_payment.plan,
                "expires_on": active_payment.subscription_end.isoformat(),
                "days_remaining": (active_payment.subscription_end - today).days,
                "is_active": True
            }
        
        profile_data = farmer.to_dict()
        profile_data.update({
            "phone": farmer.user.phone,
            "farms": farms_data,
            "active_crops": active_crops,
            "subscription": subscription
        })
        
        return jsonify({
            "success": True,
            "data": profile_data,
            "message": "Profile retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return err("server_error", "Failed to retrieve profile", 500)


@farmers_bp.post("/profile")
@jwt_required()
def create_profile():
    try:
        # Check if profile already exists
        existing = Farmer.query.filter_by(user_id=get_jwt_identity()).first()
        if existing:
            return err("conflict", "Profile already exists", 409)
        
        # Validate input
        try:
            payload = FarmerCreateSchema().load(request.get_json() or {})
        except ValidationError as e:
            return err("validation_error", "Invalid input data", 400, e.messages)
        
        # Validate county
        if payload.get('county') not in KENYAN_COUNTIES:
            return err("validation_error", "Invalid Kenyan county", 400, {
                "county": f"Must be one of: {', '.join(KENYAN_COUNTIES[:10])}..."
            })
        
        # Create farmer profile
        farmer = Farmer(
            user_id=get_jwt_identity(),
            first_name=payload['first_name'],
            last_name=payload['last_name'],
            county=payload['county'],
            sub_county=payload.get('sub_county'),
            ward=payload.get('ward'),
            village=payload.get('village'),
            national_id=payload.get('national_id'),
            profile_photo=payload.get('profile_photo')
        )
        
        db.session.add(farmer)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": farmer.to_dict(),
            "message": "Profile created successfully"
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Profile creation integrity error: {str(e)}")
        return err("conflict", "Profile with this data already exists", 409)
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Profile creation DB error: {str(e)}")
        return err("server_error", "Database error. Please try again.", 500)
    except Exception as e:
        logger.error(f"Profile creation error: {str(e)}")
        return err("server_error", "Failed to create profile", 500)


@farmers_bp.put("/profile")
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        logger.info(f"Profile update request - User ID: {user_id}")
        
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        logger.info(f"Farmer found for update: {farmer is not None}")
        
        if not farmer:
            logger.warning(f"User {user_id} trying to update profile but no farmer profile exists")
            return err("not_found", "Profile not found. Please create your profile first.", 404)
        
        payload = request.get_json() or {}
        
        # Validate county if provided
        if 'county' in payload and payload['county'] not in KENYAN_COUNTIES:
            return err("validation_error", "Invalid Kenyan county", 400, {
                "county": f"Must be one of: {', '.join(KENYAN_COUNTIES[:10])}..."
            })
        
        # Update allowed fields
        updatable_fields = [
            "first_name", "last_name", "county", "sub_county", 
            "ward", "village", "national_id", "profile_photo"
        ]
        
        for field in updatable_fields:
            if field in payload:
                setattr(farmer, field, payload[field])
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": farmer.to_dict(),
            "message": "Profile updated successfully"
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Profile update error: {str(e)}")
        return err("server_error", "Failed to update profile", 500)
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        return err("server_error", "Failed to update profile", 500)


@farmers_bp.get("/<farmer_id>")
@jwt_required()
@admin_required
def get_farmer(farmer_id):
    try:
        farmer = Farmer.query.get_or_404(farmer_id)
        return jsonify({
            "success": True,
            "data": farmer.to_dict(),
            "message": "Farmer retrieved successfully"
        }), 200
    except Exception as e:
        logger.error(f"Get farmer error: {str(e)}")
        return err("server_error", "Failed to retrieve farmer", 500)


@farmers_bp.get("/")
@jwt_required()
@admin_required
def list_farmers():
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 100)
        
        # Build query with filters
        query = Farmer.query
        
        # Filter by county
        county = request.args.get("county")
        if county:
            query = query.filter(Farmer.county == county)
        
        # Filter by subscription status
        subscribed = request.args.get("subscribed")
        if subscribed == "true":
            from datetime import date
            query = query.join(Payment).filter(
                Payment.status == 'completed',
                Payment.subscription_end >= date.today()
            )
        elif subscribed == "false":
            from datetime import date
            query = query.outerjoin(Payment).filter(
                db.or_(
                    Payment.status != 'completed',
                    Payment.subscription_end < date.today(),
                    Payment.id.is_(None)
                )
            )
        
        # Search by name
        search = request.args.get("search")
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Farmer.first_name.ilike(search_term),
                    Farmer.last_name.ilike(search_term)
                )
            )
        
        pg = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            "success": True,
            "data": {
                "items": [f.to_dict() for f in pg.items],
                "total": pg.total,
                "page": page,
                "per_page": per_page,
                "pages": pg.pages
            },
            "message": "Farmers retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"List farmers error: {str(e)}")
        return err("server_error", "Failed to retrieve farmers", 500)
