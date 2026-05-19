from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_, or_
from sqlalchemy.exc import SQLAlchemyError
from datetime import date, timedelta, datetime
import logging

from app.extensions import db
from app.models.alert import Alert
from app.models.farmer import Farmer
from app.models.payment import Payment
from app.models.sms import SMS
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.market import Market
from app.utils.decorators import admin_required
from app.services.sms_service import SMSService

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


def ok(data=None, message="Success", status=200):
    return jsonify({"success": True, "data": data or {}, "message": message}), status


logger = logging.getLogger(__name__)


@admin_bp.get("/stats")
@jwt_required()
@admin_required
def dashboard_stats():
    """Comprehensive dashboard statistics"""
    try:
        # User and farmer stats
        total_users = User.query.count()
        total_farmers = Farmer.query.count()
        
        # Handle active farmers gracefully - check if Payment table exists and has data
        try:
            active_farmers = db.session.query(Farmer.id).join(Payment).filter(
                Payment.status == 'completed',
                Payment.subscription_end >= date.today()
            ).distinct().count()
        except:
            active_farmers = 0
        
        # Subscription stats - handle gracefully
        try:
            total_subscriptions = Payment.query.filter_by(status='completed').count()
            active_subscriptions = Payment.query.filter(
                Payment.status == 'completed',
                Payment.subscription_end >= date.today()
            ).count()
        except:
            total_subscriptions = 0
            active_subscriptions = 0
        
        # Revenue stats - handle gracefully
        try:
            total_revenue = db.session.query(func.sum(Payment.amount_ksh)).filter(
                Payment.status == 'completed'
            ).scalar() or 0
        except:
            total_revenue = 0
        
        # Monthly revenue (last 12 months) - handle gracefully
        try:
            twelve_months_ago = date.today() - timedelta(days=365)
            # Use strftime for SQLite compatibility instead of date_trunc
            monthly_revenue = db.session.query(
                func.strftime('%Y-%m', Payment.created_at).label('month'),
                func.sum(Payment.amount_ksh).label('revenue')
            ).filter(
                Payment.status == 'completed',
                Payment.created_at >= twelve_months_ago
            ).group_by(
                func.strftime('%Y-%m', Payment.created_at)
            ).order_by('month').all()
        except:
            monthly_revenue = []
        
        # SMS stats - handle gracefully
        try:
            total_sms = SMS.query.count()
            sent_sms = SMS.query.filter(SMS.status.in_(['sent', 'delivered'])).count()
            failed_sms = SMS.query.filter_by(status='failed').count()
        except:
            total_sms = 0
            sent_sms = 0
            failed_sms = 0
        
        # Farm and crop stats - handle gracefully
        try:
            total_farms = Farm.query.filter_by(is_deleted=False).count()
        except:
            total_farms = 0
            
        try:
            active_crops = Crop.query.filter_by(is_active=True).count()
        except:
            active_crops = 0
        
        # Recent activity (last 7 days) - handle gracefully
        try:
            seven_days_ago = date.today() - timedelta(days=7)
            new_farmers = Farmer.query.filter(Farmer.created_at >= seven_days_ago).count()
        except:
            new_farmers = 0
            
        try:
            seven_days_ago = date.today() - timedelta(days=7)
            new_subscriptions = Payment.query.filter(
                Payment.status == 'completed',
                Payment.created_at >= seven_days_ago
            ).count()
        except:
            new_subscriptions = 0
        
        return jsonify({
            "success": True,
            "data": {
                "users": {
                    "total": total_users,
                    "farmers": total_farmers,
                    "active_farmers": active_farmers,
                    "new_this_week": new_farmers
                },
                "subscriptions": {
                    "total": total_subscriptions,
                    "active": active_subscriptions,
                    "new_this_week": new_subscriptions
                },
                "revenue": {
                    "total": float(total_revenue),
                    "monthly_breakdown": [
                        {
                            "month": month,  # month is already formatted string from strftime
                            "revenue": float(revenue)
                        }
                        for month, revenue in monthly_revenue
                    ]
                },
                "sms": {
                    "total": total_sms,
                    "sent": sent_sms,
                    "failed": failed_sms,
                    "success_rate": (sent_sms / total_sms * 100) if total_sms > 0 else 0
                },
                "farms": {
                    "total": total_farms,
                    "active_crops": active_crops
                }
            },
            "message": "Dashboard statistics retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        return err("server_error", "Failed to retrieve dashboard statistics", 500)


@admin_bp.get("/farmers")
@jwt_required()
@admin_required
def list_farmers():
    """List farmers with pagination and filtering"""
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
            query = query.join(Payment).filter(
                Payment.status == 'completed',
                Payment.subscription_end >= date.today()
            )
        elif subscribed == "false":
            query = query.outerjoin(Payment).filter(
                or_(
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
                or_(
                    Farmer.first_name.ilike(search_term),
                    Farmer.last_name.ilike(search_term)
                )
            )
        
        # Add subscription info
        query = query.outerjoin(Payment, and_(
            Farmer.id == Payment.farmer_id,
            Payment.status == 'completed',
            Payment.subscription_end >= date.today()
        ))
        
        pg = query.paginate(page=page, per_page=per_page, error_out=False)
        
        farmers_data = []
        for farmer in pg.items:
            farmer_dict = farmer.to_dict()
            farmer_dict['is_subscribed'] = any(
                p.status == 'completed' and p.subscription_end >= date.today()
                for p in farmer.subscriptions
            )
            farmer_dict['total_farms'] = len([f for f in farmer.farms if not f.is_deleted])
            farmers_data.append(farmer_dict)
        
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
        logger.error(f"List farmers error: {str(e)}")
        return err("server_error", "Failed to retrieve farmers", 500)


@admin_bp.get("/revenue")
@jwt_required()
@admin_required
def revenue_analytics():
    """Detailed revenue analytics"""
    try:
        # Total revenue - handle gracefully
        try:
            total_revenue = db.session.query(func.sum(Payment.amount_ksh)).filter(
                Payment.status == 'completed'
            ).scalar() or 0
        except:
            total_revenue = 0
        
        # Revenue by plan - handle gracefully
        try:
            revenue_by_plan = db.session.query(
                Payment.plan,
                func.sum(Payment.amount_ksh).label('amount'),
                func.count(Payment.id).label('count')
            ).filter(
                Payment.status == 'completed'
            ).group_by(Payment.plan).all()
        except:
            revenue_by_plan = []
        
        # Revenue by month (last 12 months) - handle gracefully
        try:
            twelve_months_ago = date.today() - timedelta(days=365)
            # Use strftime for SQLite compatibility instead of date_trunc
            monthly_revenue = db.session.query(
                func.strftime('%Y-%m', Payment.created_at).label('month'),
                func.sum(Payment.amount_ksh).label('revenue'),
                func.count(Payment.id).label('count')
            ).filter(
                Payment.status == 'completed',
                Payment.created_at >= twelve_months_ago
            ).group_by(
                func.strftime('%Y-%m', Payment.created_at)
            ).order_by('month').all()
        except:
            monthly_revenue = []
        
        # Revenue by county - handle gracefully
        try:
            revenue_by_county = db.session.query(
                Farmer.county,
                func.sum(Payment.amount_ksh).label('revenue'),
                func.count(Payment.id).label('count')
            ).join(Payment).filter(
                Payment.status == 'completed'
            ).group_by(Farmer.county).order_by('revenue desc').limit(10).all()
        except:
            revenue_by_county = []
        
        return jsonify({
            "success": True,
            "data": {
                "total_revenue": float(total_revenue),
                "by_plan": [
                    {
                        "plan": plan,
                        "revenue": float(amount),
                        "count": count
                    }
                    for plan, amount, count in revenue_by_plan
                ],
                "monthly_trend": [
                    {
                        "month": month,  # month is already formatted string from strftime
                        "revenue": float(revenue),
                        "subscriptions": count
                    }
                    for month, revenue, count in monthly_revenue
                ],
                "by_county": [
                    {
                        "county": county,
                        "revenue": float(revenue),
                        "subscriptions": count
                    }
                    for county, revenue, count in revenue_by_county
                ]
            },
            "message": "Revenue analytics retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Revenue analytics error: {str(e)}")
        return err("server_error", "Failed to retrieve revenue analytics", 500)


@admin_bp.get("/sms-logs")
@jwt_required()
@admin_required
def sms_logs():
    """SMS logs with pagination and filtering"""
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 50)), 200)
        
        # Build query with filters
        query = SMS.query
        
        # Filter by status
        status = request.args.get("status")
        if status:
            query = query.filter(SMS.status == status)
        
        # Filter by message type
        message_type = request.args.get("message_type")
        if message_type:
            query = query.filter(SMS.message_type == message_type)
        
        # Filter by date range
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        if start_date:
            query = query.filter(SMS.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(SMS.created_at <= datetime.fromisoformat(end_date))
        
        # Add farmer info
        query = query.outerjoin(Farmer)
        
        pg = query.order_by(SMS.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        sms_data = []
        for sms in pg.items:
            sms_dict = sms.to_dict()
            if sms.farmer:
                sms_dict['farmer_name'] = f"{sms.farmer.first_name} {sms.farmer.last_name}"
                sms_dict['farmer_county'] = sms.farmer.county
            else:
                sms_dict['farmer_name'] = None
                sms_dict['farmer_county'] = None
            sms_data.append(sms_dict)
        
        return jsonify({
            "success": True,
            "data": {
                "items": sms_data,
                "total": pg.total,
                "page": page,
                "per_page": per_page,
                "pages": pg.pages
            },
            "message": "SMS logs retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"SMS logs error: {str(e)}")
        return err("server_error", "Failed to retrieve SMS logs", 500)


@admin_bp.get("/alerts")
@jwt_required()
@admin_required
def alerts():
    """System alerts"""
    try:
        alerts = Alert.query.order_by(Alert.created_at.desc()).limit(100).all()
        
        return jsonify({
            "success": True,
            "data": [alert.to_dict() for alert in alerts],
            "message": "Alerts retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Alerts error: {str(e)}")
        return err("server_error", "Failed to retrieve alerts", 500)


@admin_bp.post("/alerts/send")
@jwt_required()
@admin_required
def send_alert():
    """Send broadcast alert to all or selected farmers"""
    try:
        payload = request.get_json() or {}
        
        # Validate required fields
        if "message" not in payload:
            return err("validation_error", "message is required", 400)
        
        message = payload["message"]
        title = payload.get("title", "AgriSync Alert")
        target_type = payload.get("target_type", "all")  # all, subscribed, county
        
        # Get target farmers
        if target_type == "all":
            farmers = Farmer.query.all()
        elif target_type == "subscribed":
            farmers = db.session.query(Farmer).join(Payment).filter(
                Payment.status == 'completed',
                Payment.subscription_end >= date.today()
            ).distinct().all()
        elif target_type == "county" and "county" in payload:
            farmers = Farmer.query.filter_by(county=payload["county"]).all()
        else:
            return err("validation_error", "Invalid target_type or missing county", 400)
        
        # Send SMS to all target farmers
        sms_results = SMSService.send_bulk_sms(
            phone_numbers=[f.user.phone for f in farmers],
            message=f"{title}\n\n{message}\n\n- AgriSync 360 Team",
            message_type="ussd_response"
        )
        
        # Log alert in database
        alert = Alert(
            title=title,
            message=message,
            target_type=target_type,
            target_county=payload.get("county"),
            recipients_count=len(farmers),
            sent_count=sms_results.get("sent", 0),
            failed_count=sms_results.get("failed", 0),
            created_by=get_jwt_identity()
        )
        
        db.session.add(alert)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": {
                "alert": alert.to_dict(),
                "sms_results": sms_results
            },
            "message": "Alert sent successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"Send alert error: {str(e)}")
        return err("server_error", "Failed to send alert", 500)


@admin_bp.get("/subscriptions")
@jwt_required()
@admin_required
def subscriptions():
    """Subscription analytics"""
    try:
        # Subscriptions by plan
        subscriptions_by_plan = db.session.query(
            Payment.plan,
            func.count(Payment.id).label('count'),
            func.sum(Payment.amount_ksh).label('revenue')
        ).filter(
            Payment.status == 'completed'
        ).group_by(Payment.plan).all()
        
        # Active vs expired
        active_count = Payment.query.filter(
            Payment.status == 'completed',
            Payment.subscription_end >= date.today()
        ).count()
        
        expired_count = Payment.query.filter(
            Payment.status == 'completed',
            Payment.subscription_end < date.today()
        ).count()
        
        # Recent subscriptions (last 30 days)
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_subscriptions = Payment.query.filter(
            Payment.status == 'completed',
            Payment.created_at >= thirty_days_ago
        ).count()
        
        # Subscription churn (expired in last 30 days)
        churn_count = Payment.query.filter(
            Payment.status == 'completed',
            Payment.subscription_end >= thirty_days_ago,
            Payment.subscription_end < date.today()
        ).count()
        
        return jsonify({
            "success": True,
            "data": {
                "by_plan": [
                    {
                        "plan": plan,
                        "count": count,
                        "revenue": float(revenue)
                    }
                    for plan, count, revenue in subscriptions_by_plan
                ],
                "status_breakdown": {
                    "active": active_count,
                    "expired": expired_count
                },
                "recent_activity": {
                    "new_subscriptions": recent_subscriptions,
                    "churned": churn_count
                }
            },
            "message": "Subscription analytics retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Subscriptions error: {str(e)}")
        return err("server_error", "Failed to retrieve subscription analytics", 500)


@admin_bp.get("/top-counties")
@jwt_required()
@admin_required
def get_top_counties():
    """Get top counties by farmer count"""
    try:
        # Query farmers by county and count - handle gracefully
        try:
            county_stats = db.session.query(
                Farmer.county,
                func.count(Farmer.id).label('farmer_count'),
                func.count(Farm.id).label('farm_count')
            ).join(Farm).group_by(Farmer.county).order_by(
                func.count(Farmer.id).desc()
            ).limit(10).all()
        except:
            county_stats = []
        
        data = [
            {
                "county": county,
                "farmers": farmer_count,
                "farms": farm_count
            }
            for county, farmer_count, farm_count in county_stats
        ]
        
        return ok(data, "Top counties retrieved successfully")
        
    except Exception as e:
        logger.error(f"Top counties error: {str(e)}")
        return err("server_error", "Failed to retrieve top counties", 500)


@admin_bp.get("/top-crops")
@jwt_required()
@admin_required
def get_top_crops():
    """Get top crops by planting area"""
    try:
        # Query crops by total planted area - handle gracefully
        try:
            crop_stats = db.session.query(
                Crop.crop_name,
                func.count(Crop.id).label('crop_count'),
                func.sum(Crop.area_planted_acres).label('total_area')
            ).group_by(Crop.crop_name).order_by(
                func.sum(Crop.area_planted_acres).desc()
            ).limit(10).all()
        except:
            crop_stats = []
        
        data = [
            {
                "crop": crop_name,
                "count": crop_count,
                "total_area": float(total_area) if total_area else 0
            }
            for crop_name, crop_count, total_area in crop_stats
        ]
        
        return ok(data, "Top crops retrieved successfully")
        
    except Exception as e:
        logger.error(f"Top crops error: {str(e)}")
        return err("server_error", "Failed to retrieve top crops", 500)


@admin_bp.get("/recent-farmers")
@jwt_required()
@admin_required
def get_recent_farmers():
    """Get recently registered farmers"""
    try:
        # Get recent farmers with their user info - handle gracefully
        try:
            recent_farmers = db.session.query(
                Farmer,
                User
            ).join(User).order_by(
                User.created_at.desc()
            ).limit(10).all()
        except:
            recent_farmers = []
        
        data = [
            {
                "id": str(farmer.id),
                "name": f"{farmer.first_name} {farmer.last_name}",
                "email": user.email,
                "phone": user.phone,
                "county": farmer.county,
                "registered_date": user.created_at.isoformat(),
                "is_active": user.is_active,
                "is_verified": user.is_verified
            }
            for farmer, user in recent_farmers
        ]
        
        return ok(data, "Recent farmers retrieved successfully")
        
    except Exception as e:
        logger.error(f"Recent farmers error: {str(e)}")
        return err("server_error", "Failed to retrieve recent farmers", 500)


@admin_bp.get("/system-health")
@jwt_required()
@admin_required
def get_system_health():
    """Get system health metrics"""
    try:
        # Get system metrics - handle gracefully
        try:
            total_users = User.query.count()
        except:
            total_users = 0
            
        try:
            total_farmers = Farmer.query.count()
        except:
            total_farmers = 0
            
        try:
            total_farms = Farm.query.count()
        except:
            total_farms = 0
            
        try:
            total_crops = Crop.query.count()
        except:
            total_crops = 0
            
        try:
            total_payments = Payment.query.count()
        except:
            total_payments = 0
        
        # Get recent activity (last 24 hours) - handle gracefully
        try:
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_users = User.query.filter(User.created_at >= yesterday).count()
        except:
            recent_users = 0
            
        try:
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_payments = Payment.query.filter(Payment.created_at >= yesterday).count()
        except:
            recent_payments = 0
        
        # Get subscription stats - handle gracefully
        try:
            active_subscriptions = Payment.query.filter(
                Payment.status == 'completed',
                Payment.subscription_end >= date.today()
            ).count()
        except:
            active_subscriptions = 0
        
        data = {
            "users": {
                "total": total_users,
                "recent": recent_users
            },
            "farmers": {
                "total": total_farmers,
                "active": active_subscriptions
            },
            "farms": {
                "total": total_farms
            },
            "crops": {
                "total": total_crops
            },
            "payments": {
                "total": total_payments,
                "recent": recent_payments
            },
            "system": {
                "status": "healthy",
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
        return ok(data, "System health retrieved successfully")
        
    except Exception as e:
        logger.error(f"System health error: {str(e)}")
        return err("server_error", "Failed to retrieve system health", 500)
