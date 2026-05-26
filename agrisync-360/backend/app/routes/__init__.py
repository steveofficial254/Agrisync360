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
from app.routes.agro_dealer import agro_dealer_bp
from app.routes.ngo import ngo_bp
from app.routes.ai_chat import ai_bp
from app.routes.community import community_bp
from app.routes.greenhouse import greenhouse_bp
from app.routes.yields import yields_bp
from app.routes.farm_ops import farm_ops_bp, inventory_bp, batches_bp, compliance_bp
from app.routes.whatsapp import whatsapp_bp
from app.routes.farm_intelligence import farm_intel_bp
from app.routes.financial import financial_bp
from app.routes.market_pro import market_pro_bp

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
    agro_dealer_bp,
    ngo_bp,
    admin_bp,
    ai_bp,
    community_bp,
    greenhouse_bp,
    yields_bp,
    farm_ops_bp,
    inventory_bp,
    batches_bp,
    compliance_bp,
    whatsapp_bp,
    farm_intel_bp,
    financial_bp,
    market_pro_bp,
]
