from app import create_app
from app.extensions import celery as celery_ext
from celery.schedules import crontab

flask_app = create_app('development')
celery = celery_ext

celery.conf.update(
    broker_url=flask_app.config['CELERY_BROKER_URL'],
    result_backend=flask_app.config['CELERY_RESULT_BACKEND'],
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='Africa/Nairobi',
    enable_utc=True,
    beat_schedule={
        'refresh-weather-6h': {
            'task': 'app.tasks.weather_tasks.refresh_weather_for_all_farmers',
            'schedule': crontab(minute=0, hour='*/6'),
        },
        'send-weather-alerts': {
            'task': 'app.tasks.weather_tasks.send_weather_alerts',
            'schedule': crontab(minute=30, hour='*/6'),
        },
        'weekly-advisory-sunday': {
            'task': 'app.tasks.sms_tasks.send_weekly_advisory',
            'schedule': crontab(minute=0, hour=7, day_of_week=0),
        },
        'daily-market-prices': {
            'task': 'app.tasks.market_tasks.scrape_market_prices',
            'schedule': crontab(minute=0, hour=8),
        },
        'subscription-reminders': {
            'task': 'app.tasks.sms_tasks.send_subscription_expiry_reminders',
            'schedule': crontab(minute=0, hour=9),
        },
    }
)

class FlaskTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with flask_app.app_context():
            return self.run(*args, **kwargs)

celery.Task = FlaskTask

if __name__ == '__main__':
    celery.start()
