from celery.schedules import crontab

from app import create_app
from app.extensions import celery

app = create_app("development")

celery.conf.update(
    broker_url=app.config["CELERY_BROKER_URL"],
    result_backend=app.config["CELERY_RESULT_BACKEND"],
    imports=["app.tasks.weather_tasks", "app.tasks.market_tasks", "app.tasks.sms_tasks"],
    beat_schedule={
        "refresh-weather-6h": {
            "task": "app.tasks.weather_tasks.refresh_weather_for_all_farmers",
            "schedule": crontab(minute=0, hour="*/6"),
        },
        "send-weather-alerts": {
            "task": "app.tasks.weather_tasks.send_weather_alerts",
            "schedule": crontab(minute=30, hour="*/6"),
        },
        "weekly-advisory": {
            "task": "app.tasks.weather_tasks.send_weekly_advisory",
            "schedule": crontab(minute=0, hour=7, day_of_week=0),
        },
        "daily-market-scrape": {
            "task": "app.tasks.market_tasks.scrape_market_prices",
            "schedule": crontab(minute=0, hour=8),
        },
        "subscription-reminders": {
            "task": "app.tasks.sms_tasks.send_subscription_expiry_reminders",
            "schedule": crontab(minute=0, hour=9),
        },
    },
    timezone="Africa/Nairobi",
)
