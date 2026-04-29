from datetime import date, timedelta
from app.extensions import celery, db
from app.models.payment import Payment
from app.models.farmer import Farmer
from app.models.sms import SMS
from app.services.sms_service import SMSService
import logging

logger = logging.getLogger(__name__)


@celery.task
def send_subscription_expiry_reminders():
    """Send reminders to farmers whose subscriptions expire in 3 days"""
    try:
        # Find subscriptions expiring in 3 days
        expiry_date = date.today() + timedelta(days=3)
        expiring_payments = Payment.query.filter(
            Payment.status == 'completed',
            Payment.subscription_end == expiry_date
        ).all()
        
        reminders_sent = 0
        reminders_failed = 0
        
        for payment in expiring_payments:
            try:
                # Get farmer details
                farmer = payment.farmer
                if not farmer:
                    reminders_failed += 1
                    continue
                
                # Build reminder message
                message = (
                    f"🔔 Subscription Reminder - {farmer.first_name}\n\n"
                    f"Your AgriSync 360 {payment.plan.replace('_', ' ').title()} "
                    f"subscription expires in 3 days!\n\n"
                    f"Expiry date: {payment.subscription_end}\n"
                    f"Plan: {payment.plan.replace('_', ' ').title()}\n\n"
                    f"Renew now to continue enjoying:\n"
                    f"• Weather alerts & forecasts\n"
                    f"• Market price intelligence\n"
                    f"• Crop advisories\n"
                    f"• Expert farming tips\n\n"
                    f"Renew via the app or contact support.\n"
                    f"- AgriSync 360 Team"
                )
                
                # Send SMS
                result = SMSService.send_sms(
                    farmer.user.phone,
                    message,
                    message_type='subscription',
                    farmer_id=farmer.id
                )
                
                if result.get('status') in ['Success', 'sent', 'dev_mode']:
                    reminders_sent += 1
                else:
                    reminders_failed += 1
                    
            except Exception as e:
                logger.error(f"Reminder failed for payment {payment.id}: {str(e)}")
                reminders_failed += 1
        
        logger.info(f"Subscription reminders completed: {reminders_sent} sent, {reminders_failed} failed")
        return {
            "status": "success",
            "reminders_sent": reminders_sent,
            "reminders_failed": reminders_failed,
            "total_expiring": len(expiring_payments)
        }
        
    except Exception as e:
        logger.error(f"Subscription reminders task error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@celery.task
def send_subscription_expired_notifications():
    """Send notifications to farmers whose subscriptions expired today"""
    try:
        # Find subscriptions that expired today
        expiry_date = date.today()
        expired_payments = Payment.query.filter(
            Payment.status == 'completed',
            Payment.subscription_end == expiry_date
        ).all()
        
        notifications_sent = 0
        notifications_failed = 0
        
        for payment in expired_payments:
            try:
                # Get farmer details
                farmer = payment.farmer
                if not farmer:
                    notifications_failed += 1
                    continue
                
                # Build expiration message
                message = (
                    f"⚠️ Subscription Expired - {farmer.first_name}\n\n"
                    f"Your AgriSync 360 {payment.plan.replace('_', ' ').title()} "
                    f"subscription expired today.\n\n"
                    f"Expired on: {payment.subscription_end}\n"
                    f"Plan: {payment.plan.replace('_', ' ').title()}\n\n"
                    f"Renew now to continue accessing:\n"
                    f"• Weather forecasts & alerts\n"
                    f"• Market price updates\n"
                    f"• Personalized crop advisories\n"
                    f"• Farm management tools\n\n"
                    f"Click 'Subscribe' in your app to renew.\n"
                    f"Need help? Contact our support team.\n"
                    f"- AgriSync 360"
                )
                
                # Send SMS
                result = SMSService.send_sms(
                    farmer.user.phone,
                    message,
                    message_type='subscription',
                    farmer_id=farmer.id
                )
                
                if result.get('status') in ['Success', 'sent', 'dev_mode']:
                    notifications_sent += 1
                else:
                    notifications_failed += 1
                    
            except Exception as e:
                logger.error(f"Expiration notification failed for payment {payment.id}: {str(e)}")
                notifications_failed += 1
        
        logger.info(f"Expiration notifications completed: {notifications_sent} sent, {notifications_failed} failed")
        return {
            "status": "success",
            "notifications_sent": notifications_sent,
            "notifications_failed": notifications_failed,
            "total_expired": len(expired_payments)
        }
        
    except Exception as e:
        logger.error(f"Expiration notifications task error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@celery.task
def cleanup_old_sms_logs():
    """Clean up SMS logs older than 90 days to manage database size"""
    try:
        # Calculate cutoff date (90 days ago)
        cutoff_date = date.today() - timedelta(days=90)
        
        # Count old SMS logs before deletion
        old_count = db.session.query(SMS).filter(
            SMS.created_at < cutoff_date
        ).count()
        
        if old_count == 0:
            return {
                "status": "success",
                "deleted_count": 0,
                "message": "No old SMS logs to clean up"
            }
        
        # Delete old SMS logs
        deleted = db.session.query(SMS).filter(
            SMS.created_at < cutoff_date
        ).delete()
        
        db.session.commit()
        
        logger.info(f"SMS cleanup completed: {deleted} logs deleted")
        return {
            "status": "success",
            "deleted_count": deleted,
            "cutoff_date": cutoff_date.isoformat(),
            "message": f"Cleaned up {deleted} SMS logs older than 90 days"
        }
        
    except Exception as e:
        logger.error(f"SMS cleanup task error: {str(e)}")
        db.session.rollback()
        return {
            "status": "error",
            "message": str(e)
        }
