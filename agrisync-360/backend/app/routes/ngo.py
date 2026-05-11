from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_, or_
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
import logging

from app.extensions import db
from app.models.user import User
from app.models.farmer import Farmer
from app.models.ngo import NGOProfile, BulkFarmerRegistration
from app.models.payment import Payment
from app.models.crop import Crop
from app.models.farm import Farm
from app.utils.decorators import ngo_required
from app.services.sms_service import SMSService

ngo_bp = Blueprint("ngo", __name__, url_prefix="/api/ngo")


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


logger = logging.getLogger(__name__)


@ngo_bp.get("/profile")
@jwt_required()
@ngo_required
def get_profile():
    """Get NGO organization profile"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        return ok(ngo.to_dict(), "Profile retrieved successfully")
        
    except Exception as e:
        logger.error(f"Get NGO profile error: {str(e)}")
        return err("server_error", "Failed to retrieve profile", 500)


@ngo_bp.post("/profile")
@jwt_required()
@ngo_required
def create_profile():
    """Create NGO profile"""
    try:
        current_user_id = get_jwt_identity()
        payload = request.get_json() or {}
        
        # Validate required fields
        required_fields = ["organization_name", "organization_type"]
        for field in required_fields:
            if field not in payload:
                return err("validation_error", f"Missing required field: {field}", 400)
        
        # Check if profile already exists
        existing = NGOProfile.query.filter_by(user_id=current_user_id).first()
        if existing:
            return err("duplicate", "Profile already exists", 409)
        
        # Create NGO profile
        ngo = NGOProfile(
            user_id=current_user_id,
            organization_name=payload["organization_name"],
            organization_type=payload["organization_type"],
            focus_counties=payload.get("focus_counties", []),
            focus_crops=payload.get("focus_crops", []),
            total_beneficiaries_target=payload.get("total_beneficiaries_target"),
            is_verified=False
        )
        
        db.session.add(ngo)
        db.session.commit()
        
        return ok(ngo.to_dict(), "Profile created successfully", 201)
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Create NGO profile error: {str(e)}")
        return err("server_error", "Failed to create profile", 500)
    except Exception as e:
        logger.error(f"Create NGO profile error: {str(e)}")
        return err("server_error", "Failed to create profile", 500)


@ngo_bp.put("/profile")
@jwt_required()
@ngo_required
def update_profile():
    """Update NGO profile"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        payload = request.get_json() or {}
        
        # Update fields
        for field in ["organization_name", "focus_counties", "focus_crops", "total_beneficiaries_target"]:
            if field in payload:
                setattr(ngo, field, payload[field])
        
        db.session.commit()
        
        return ok(ngo.to_dict(), "Profile updated successfully")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Update NGO profile error: {str(e)}")
        return err("server_error", "Failed to update profile", 500)
    except Exception as e:
        logger.error(f"Update NGO profile error: {str(e)}")
        return err("server_error", "Failed to update profile", 500)


@ngo_bp.get("/dashboard")
@jwt_required()
@ngo_required
def dashboard():
    """Get NGO impact dashboard"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        # Beneficiaries metrics
        total_registered = Farmer.query.join(User).filter(
            User.role == 'farmer'
        ).count()
        
        # Active this month
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_this_month = Farmer.query.join(User).filter(
            User.role == 'farmer',
            Farmer.created_at >= thirty_days_ago
        ).count()
        
        # Counties coverage
        counties = ngo.focus_counties or []
        farmers_by_county = {}
        
        for county in counties:
            count = Farmer.query.filter_by(county=county).count()
            if count > 0:
                farmers_by_county[county] = count
        
        # Crops coverage
        crops = ngo.focus_crops or []
        farmers_by_crop = {}
        
        for crop in crops:
            count = db.session.query(Farmer).join(Farm).join(Crop).filter(
                Crop.crop_name == crop,
                Crop.is_active == True
            ).count()
            if count > 0:
                farmers_by_crop[crop] = count
        
        # Subscription analytics
        active_subscriptions = db.session.query(Payment).filter(
            Payment.status == 'completed',
            Payment.subscription_end >= datetime.utcnow().date()
        ).count()
        
        # Calculate progress
        progress_percent = 0
        if ngo.total_beneficiaries_target:
            progress_percent = round((total_registered / ngo.total_beneficiaries_target) * 100, 1)
        
        # Contract validity
        days_remaining = 0
        if ngo.contract_end:
            days_remaining = (ngo.contract_end - date.today()).days
        
        dashboard_data = {
            "beneficiaries": {
                "total_registered": total_registered,
                "active_this_month": active_this_month,
                "target": ngo.total_beneficiaries_target,
                "progress_percent": progress_percent
            },
            "coverage": {
                "counties": list(farmers_by_county.keys()),
                "crops": list(farmers_by_crop.keys()),
                "farmers_by_county": farmers_by_county,
                "farmers_by_crop": farmers_by_crop
            },
            "advisories_delivered": active_subscriptions * 10,  # Estimated
            "weather_alerts_sent": active_subscriptions * 5,  # Estimated
            "subscription_status": {
                "contract_valid_until": ngo.contract_end.isoformat() if ngo.contract_end else None,
                "days_remaining": days_remaining
            }
        }
        
        return ok(dashboard_data, "Dashboard retrieved successfully")
        
    except Exception as e:
        logger.error(f"NGO dashboard error: {str(e)}")
        return err("server_error", "Failed to retrieve dashboard", 500)


@ngo_bp.post("/farmers/bulk-register")
@jwt_required()
@ngo_required
def bulk_register():
    """Register multiple farmers at once"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        payload = request.get_json() or {}
        
        # Validate required fields
        required_fields = ["county", "batch_name", "farmers"]
        for field in required_fields:
            if field not in payload:
                return err("validation_error", f"Missing required field: {field}", 400)
        
        farmers_data = payload["farmers"]
        if not isinstance(farmers_data, list) or len(farmers_data) == 0:
            return err("validation_error", "farmers must be a non-empty array", 400)
        
        # Create batch record
        batch = BulkFarmerRegistration(
            ngo_id=ngo.id,
            batch_name=payload["batch_name"],
            total_farmers=len(farmers_data),
            county=payload["county"],
            status='pending'
        )
        
        db.session.add(batch)
        db.session.flush()  # Get batch ID
        
        # Trigger async processing
        from app.tasks.ngo_tasks import process_bulk_farmer_registration
        process_bulk_farmer_registration.delay(
            str(batch.id), farmers_data, str(ngo.id)
        )
        
        db.session.commit()
        
        return ok({
            "batch_id": str(batch.id),
            "total": len(farmers_data),
            "status": "processing"
        }, "Bulk registration started")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Bulk registration error: {str(e)}")
        return err("server_error", "Failed to start bulk registration", 500)
    except Exception as e:
        logger.error(f"Bulk registration error: {str(e)}")
        return err("server_error", "Failed to start bulk registration", 500)


@ngo_bp.get("/farmers/bulk-register/<batch_id>")
@jwt_required()
@ngo_required
def get_bulk_registration_status(batch_id):
    """Check batch registration status"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        batch = BulkFarmerRegistration.query.filter_by(id=batch_id, ngo_id=ngo.id).first()
        
        if not batch:
            return err("not_found", "Batch not found", 404)
        
        return ok(batch.to_dict(), "Batch status retrieved successfully")
        
    except Exception as e:
        logger.error(f"Get batch status error: {str(e)}")
        return err("server_error", "Failed to retrieve batch status", 500)


@ngo_bp.get("/farmers")
@jwt_required()
@ngo_required
def get_farmers():
    """List all farmers registered under this NGO"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        # Query parameters
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 100)
        county_filter = request.args.get("county")
        crop_filter = request.args.get("crop")
        
        # Build query
        query = Farmer.query.join(User).filter(User.role == 'farmer')
        
        if county_filter:
            query = query.filter(Farmer.county == county_filter)
        
        if crop_filter:
            query = query.join(Farm).join(Crop).filter(
                Crop.crop_name == crop_filter,
                Crop.is_active == True
            )
        
        # Paginate
        pg = query.paginate(page=page, per_page=per_page, error_out=False)
        
        farmers_data = []
        for farmer in pg.items:
            # Get subscription status
            from app.services.mpesa_service import MpesaService
            sub = MpesaService.check_subscription_status(farmer.id)
            
            farmers_data.append({
                "id": str(farmer.id),
                "first_name": farmer.first_name,
                "last_name": farmer.last_name,
                "phone": farmer.phone,
                "county": farmer.county,
                "sub_county": farmer.sub_county,
                "created_at": farmer.created_at.isoformat() if farmer.created_at else None,
                "subscription_status": sub.get('plan', 'free'),
                "is_active": sub.get('is_active', False)
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
        logger.error(f"Get NGO farmers error: {str(e)}")
        return err("server_error", "Failed to retrieve farmers", 500)


@ngo_bp.post("/broadcast")
@jwt_required()
@ngo_required
def broadcast():
    """Send advisory SMS to all NGO farmers"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        payload = request.get_json() or {}
        
        # Validate required fields
        if "message" not in payload:
            return err("validation_error", "message is required", 400)
        
        message = payload["message"]
        segment = payload.get("segment", "all")
        
        # Build farmer query
        query = Farmer.query.join(User).filter(User.role == 'farmer')
        
        # Filter by segment
        if segment.startswith("county:"):
            county = segment.replace("county:", "")
            if county in (ngo.focus_counties or []):
                query = query.filter(Farmer.county == county)
        elif segment.startswith("crop:"):
            crop = segment.replace("crop:", "")
            if crop in (ngo.focus_crops or []):
                query = query.join(Farm).join(Crop).filter(
                    Crop.crop_name == crop,
                    Crop.is_active == True
                )
        
        farmers = query.all()
        
        sent_count = 0
        failed_count = 0
        
        for farmer in farmers:
            try:
                # Send SMS
                SMSService.send_sms(
                    farmer.phone,
                    message,
                    'ngo_advisory',
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
            "message": f"Advisory sent to {sent_count} farmers"
        }, "Broadcast completed")
        
    except Exception as e:
        logger.error(f"NGO broadcast error: {str(e)}")
        return err("server_error", "Failed to send broadcast", 500)


@ngo_bp.get("/reports/impact")
@jwt_required()
@ngo_required
def impact_report():
    """Monthly impact report"""
    try:
        current_user_id = get_jwt_identity()
        ngo = NGOProfile.query.filter_by(user_id=current_user_id).first()
        
        if not ngo:
            return err("not_found", "NGO profile not found", 404)
        
        # Get current month
        from datetime import date
        current_month = date.today().replace(day=1)
        
        # Calculate metrics (simplified)
        total_farmers = Farmer.query.join(User).filter(
            User.role == 'farmer',
            Farmer.created_at >= current_month
        ).count()
        
        # Estimate advisories delivered (based on active subscriptions)
        active_subs = db.session.query(Payment).filter(
            Payment.status == 'completed',
            Payment.subscription_end >= date.today()
        ).count()
        
        advisories_delivered = active_subs * 4  # Weekly advisories
        
        # Weather alerts (simplified)
        weather_alerts = active_subs * 8  # Bi-weekly alerts
        
        report = {
            "month": current_month.strftime("%B %Y"),
            "total_farmers_registered": total_farmers,
            "advisories_delivered": advisories_delivered,
            "weather_alerts_sent": weather_alerts,
            "engagement_rate": round((advisories_delivered + weather_alerts) / total_farmers, 2) if total_farmers > 0 else 0,
            "focus_areas": {
                "counties": ngo.focus_counties or [],
                "crops": ngo.focus_crops or []
            }
        }
        
        return ok(report, "Impact report generated successfully")
        
    except Exception as e:
        logger.error(f"Impact report error: {str(e)}")
        return err("server_error", "Failed to generate report", 500)
