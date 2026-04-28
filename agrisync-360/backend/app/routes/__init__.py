from app.routes.admin import admin_bp
from app.routes.advisory import advisory_bp
from app.routes.auth import auth_bp
from app.routes.farmers import farmers_bp
from app.routes.farms import farms_bp
from app.routes.market import market_bp
from app.routes.payments import payments_bp
from app.routes.sms import sms_bp
from app.routes.ussd import ussd_bp
from app.routes.weather import weather_bp

ALL_BLUEPRINTS = [
    auth_bp,
    farmers_bp,
    farms_bp,
    weather_bp,
    advisory_bp,
    market_bp,
    payments_bp,
    sms_bp,
    ussd_bp,
    admin_bp,
]
