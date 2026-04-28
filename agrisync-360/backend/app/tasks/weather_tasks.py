import logging

from app.extensions import celery
from app.models.farmer import Farmer
from app.services.sms_service import SMSService
from app.services.weather_service import WeatherService

logger = logging.getLogger(__name__)


@celery.task
def refresh_weather_for_all_farmers():
    updated = 0
    for farmer in Farmer.query.all():
        farm = farmer.farms.filter_by(is_primary=True, is_deleted=False).first() or farmer.farms.first()
        if not farm:
            continue
        lat, lon = farm.get_coordinates()
        WeatherService.get_forecast(lat, lon)
        updated += 1
    return {"updated": updated}


@celery.task
def send_weather_alerts():
    sms = SMSService()
    sent = 0
    for farmer in Farmer.query.all():
        farm = farmer.farms.filter_by(is_primary=True, is_deleted=False).first() or farmer.farms.first()
        if not farm:
            continue
        lat, lon = farm.get_coordinates()
        forecast = WeatherService.get_forecast(lat, lon)
        if forecast:
            result = sms.send_weather_alert(farmer, forecast[0])
            if result.get("status") == "sent":
                sent += 1
    return {"sent": sent}


@celery.task
def send_weekly_advisory():
    from app.services.advisory_service import AdvisoryService

    sms = SMSService()
    sent = 0
    for farmer in Farmer.query.all():
        for farm in farmer.farms.filter_by(is_deleted=False).all():
            for crop in farm.crop_subscriptions.filter_by(is_active=True).all():
                advisories = AdvisoryService.get_crop_advisory(crop.crop_name, farmer.county, crop.growth_stage)
                if not advisories:
                    continue
                msg = f"Weekly advisory ({crop.crop_name}): {advisories[0]['title']}"
                result = sms.send_sms(farmer.user.phone, msg, farmer.id, "advisory")
                if result.get("status") == "sent":
                    sent += 1
    return {"sent": sent}
