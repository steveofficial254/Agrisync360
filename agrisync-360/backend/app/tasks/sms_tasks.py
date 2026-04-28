from datetime import date, timedelta

from app.extensions import celery
from app.models.payment import Payment
from app.services.sms_service import SMSService


@celery.task
def send_subscription_expiry_reminders():
    sms = SMSService()
    target = date.today() + timedelta(days=3)
    expiring = Payment.query.filter_by(status="completed").filter(Payment.subscription_end == target).all()
    sent = 0
    for payment in expiring:
        msg = f"Reminder: your AgriSync 360 subscription expires on {payment.subscription_end}. Renew to continue services."
        result = sms.send_sms(payment.phone_number, msg, payment.farmer_id, "subscription")
        if result.get("status") == "sent":
            sent += 1
    return {"sent": sent}
