import logging
from datetime import date, timedelta
from app.extensions import celery, db
from app.models.farmer import Farmer
from app.models.payment import Payment
from app.models.farm import Farm
from app.models.crop import Crop
from app.services.sms_service import SMSService
from app.services.weather_service import WeatherService
from app.services.advisory_service import AdvisoryService

logger = logging.getLogger(__name__)


@celery.task
def refresh_weather_for_all_farmers():
    """Daily task to refresh weather data for all farmers with active subscriptions"""
    try:
        # Get only farmers with active subscriptions
        active_farmers = db.session.query(Farmer).join(Payment).filter(
            Payment.status == 'completed',
            Payment.subscription_end >= date.today()
        ).distinct().all()
        
        updated_count = 0
        failed_count = 0
        
        for farmer in active_farmers:
            try:
                # Get farmer's primary farm or any farm
                farm = farmer.farms.filter_by(is_primary=True, is_deleted=False).first()
                if not farm:
                    farm = farmer.farms.filter_by(is_deleted=False).first()
                
                if not farm:
                    failed_count += 1
                    continue
                
                lat, lon = farm.get_coordinates()
                if not lat or not lon:
                    failed_count += 1
                    continue
                
                # Refresh weather forecast
                WeatherService.get_forecast(lat, lon)
                updated_count += 1
                
            except Exception as e:
                logger.error(f"Weather refresh failed for farmer {farmer.id}: {str(e)}")
                failed_count += 1
        
        logger.info(f"Weather refresh completed: {updated_count} updated, {failed_count} failed")
        return {
            "status": "success",
            "updated": updated_count,
            "failed": failed_count,
            "total_farmers": len(active_farmers)
        }
        
    except Exception as e:
        logger.error(f"Weather refresh task error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@celery.task
def send_weather_alerts():
    """Send weather alerts to subscribed farmers based on forecast conditions"""
    try:
        # Get only farmers with pro subscriptions (weather alerts are a pro feature)
        pro_farmers = db.session.query(Farmer).join(Payment).filter(
            Payment.status == 'completed',
            Payment.subscription_end >= date.today(),
            Payment.plan.in_(['pro_monthly', 'pro_annual'])
        ).distinct().all()
        
        alerts_sent = 0
        alerts_failed = 0
        total_checks = 0
        
        for farmer in pro_farmers:
            try:
                # Get farmer's primary farm
                farm = farmer.farms.filter_by(is_primary=True, is_deleted=False).first()
                if not farm:
                    farm = farmer.farms.filter_by(is_deleted=False).first()
                
                if not farm:
                    alerts_failed += 1
                    continue
                
                lat, lon = farm.get_coordinates()
                if not lat or not lon:
                    alerts_failed += 1
                    continue
                
                # Get weather forecast
                forecast = WeatherService.get_forecast(lat, lon)
                if not forecast or not forecast.get('forecast'):
                    total_checks += 1
                    continue
                
                # Check for alert conditions (high disease risk, frost, etc.)
                today_forecast = forecast['forecast'][0] if forecast['forecast'] else {}
                
                should_alert = False
                alert_title = ""
                alert_message = ""
                
                # Check disease risk
                if today_forecast.get('disease_risk') in ['high', 'very_high']:
                    should_alert = True
                    alert_title = f"Weather Alert - High Disease Risk"
                    alert_message = (
                        f"High disease risk detected for your area. "
                        f"Risk level: {today_forecast.get('disease_risk')}. "
                        f"Consider preventive measures for your crops."
                    )
                
                # Check frost risk
                elif today_forecast.get('frost_risk', False):
                    should_alert = True
                    alert_title = "Frost Warning"
                    alert_message = (
                        "Frost risk detected overnight. "
                        "Protect sensitive crops with covers or irrigation."
                    )
                
                # Check extreme weather
                elif today_forecast.get('temp_max', 0) > 35:
                    should_alert = True
                    alert_title = "Heat Warning"
                    alert_message = (
                        f"High temperature expected ({today_forecast.get('temp_max')}°C). "
                        "Ensure adequate irrigation for your crops."
                    )
                
                elif today_forecast.get('precipitation_mm', 0) > 50:
                    should_alert = True
                    alert_title = "Heavy Rain Warning"
                    alert_message = (
                        f"Heavy rainfall expected ({today_forecast.get('precipitation_mm')}mm). "
                        "Ensure proper drainage to prevent waterlogging."
                    )
                
                if should_alert:
                    # Send SMS alert
                    full_message = (
                        f"{alert_title}\n\n"
                        f"{alert_message}\n\n"
                        f"Location: {farm.name}, {farmer.county}\n"
                        f"- AgriSync 360 Weather Service"
                    )
                    
                    result = SMSService.send_sms(
                        farmer.user.phone,
                        full_message,
                        message_type='weather_alert',
                        farmer_id=farmer.id
                    )
                    
                    if result.get('status') in ['Success', 'sent', 'dev_mode']:
                        alerts_sent += 1
                    else:
                        alerts_failed += 1
                
                total_checks += 1
                
            except Exception as e:
                logger.error(f"Weather alert failed for farmer {farmer.id}: {str(e)}")
                alerts_failed += 1
        
        logger.info(f"Weather alerts completed: {alerts_sent} sent, {alerts_failed} failed, {total_checks} checked")
        return {
            "status": "success",
            "alerts_sent": alerts_sent,
            "alerts_failed": alerts_failed,
            "total_checks": total_checks
        }
        
    except Exception as e:
        logger.error(f"Weather alerts task error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@celery.task
def send_weekly_advisory():
    """Send weekly crop advisories to subscribed farmers"""
    try:
        # Get farmers with active subscriptions
        active_farmers = db.session.query(Farmer).join(Payment).filter(
            Payment.status == 'completed',
            Payment.subscription_end >= date.today()
        ).distinct().all()
        
        advisories_sent = 0
        advisories_failed = 0
        total_crops = 0
        
        for farmer in active_farmers:
            try:
                # Get all active crops for this farmer
                farmer_crops = []
                for farm in farmer.farms.filter_by(is_deleted=False).all():
                    for crop in farm.crop_subscriptions.filter_by(is_active=True).all():
                        farmer_crops.append(crop)
                
                if not farmer_crops:
                    continue
                
                # Build weekly advisory message
                advisory_messages = []
                
                for crop in farmer_crops:
                    total_crops += 1
                    
                    # Get current growth stage (auto-calculated)
                    current_stage = crop.get_current_growth_stage()
                    
                    # Get relevant advisories for this crop and stage
                    advisories = AdvisoryService.get_crop_advisory(
                        crop_name=crop.crop_name,
                        county=farmer.county,
                        growth_stage=current_stage
                    )
                    
                    if advisories:
                        # Take the most relevant advisory (first one)
                        advisory = advisories[0]
                        advisory_messages.append(
                            f"🌾 {crop.crop_name.title()} ({current_stage}):\n"
                            f"{advisory['title']}\n"
                            f"{advisory['content'][:100]}..."
                        )
                
                if advisory_messages:
                    # Combine all advisories into one message
                    weekly_message = (
                        f"📋 Weekly Crop Advisory - {farmer.first_name}\n\n"
                        f"{'─' * 40}\n\n"
                        f"{chr(10).join(advisory_messages[:3])}\n\n"  # Limit to 3 crops
                        f"{'─' * 40}\n"
                        f"For detailed advice, check your AgriSync app.\n"
                        f"- AgriSync 360 Advisory Service"
                    )
                    
                    result = SMSService.send_sms(
                        farmer.user.phone,
                        weekly_message,
                        message_type='advisory',
                        farmer_id=farmer.id
                    )
                    
                    if result.get('status') in ['Success', 'sent', 'dev_mode']:
                        advisories_sent += 1
                    else:
                        advisories_failed += 1
                
            except Exception as e:
                logger.error(f"Weekly advisory failed for farmer {farmer.id}: {str(e)}")
                advisories_failed += 1
        
        logger.info(f"Weekly advisories completed: {advisories_sent} sent, {advisories_failed} failed, {total_crops} crops covered")
        return {
            "status": "success",
            "advisories_sent": advisories_sent,
            "advisories_failed": advisories_failed,
            "total_crops": total_crops
        }
        
    except Exception as e:
        logger.error(f"Weekly advisory task error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
