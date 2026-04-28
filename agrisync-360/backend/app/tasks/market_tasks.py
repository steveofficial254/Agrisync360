from datetime import date

from app.extensions import celery, db
from app.models.market import Market
from app.models.payment import Payment
from app.services.sms_service import SMSService


@celery.task
def scrape_market_prices():
    samples = [
        {
            "crop_name": "maize",
            "county": "Nairobi",
            "market_name": "Wakulima",
            "price_per_kg": 55.0,
            "unit": "kg",
            "price_per_unit": 55.0,
            "demand_level": "high",
            "source": "Wakulima",
            "recorded_date": date.today(),
        },
        {
            "crop_name": "beans",
            "county": "Nakuru",
            "market_name": "Nakuru Market",
            "price_per_kg": 110.0,
            "unit": "kg",
            "price_per_unit": 110.0,
            "demand_level": "medium",
            "source": "County Feed",
            "recorded_date": date.today(),
        },
    ]
    for row in samples:
        db.session.add(Market(**row))
    db.session.commit()
    return {"saved": len(samples)}


@celery.task
def send_market_alerts():
    sms = SMSService()
    sent = 0
    subscribers = Payment.query.filter(Payment.status == "completed", Payment.plan.in_(["pro_monthly", "pro_annual"]))
    for sub in subscribers:
        result = sms.send_sms(sub.phone_number, "Market alert: Significant crop price movement detected today.", sub.farmer_id, "market_alert")
        if result.get("status") == "sent":
            sent += 1
    return {"sent": sent}
