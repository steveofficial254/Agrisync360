PLAN_PRICES = {
    'basic_monthly': 99,
    'pro_monthly': 299,
    'basic_annual': 799,    # 2 months free
    'pro_annual': 2499,     # 2 months free
    'ngo_annual': 15000,    # custom
    'county_annual': 50000  # custom
}

PLAN_FEATURES = {
    'free': {
        'weather_forecast': True,      # 3-day only
        'weather_days': 3,
        'crop_advisory': False,
        'market_prices': False,
        'sms_alerts': False,
        'sms_per_month': 0,
        'disease_risk': False,
        'planting_calendar': False,
        'profitability_calc': False,
        'ussd_access': True,           # always free
        'farms_allowed': 1,
        'crops_allowed': 2,
    },
    'basic': {
        'weather_forecast': True,
        'weather_days': 7,
        'crop_advisory': True,
        'market_prices': True,
        'sms_alerts': True,
        'sms_per_month': 4,
        'disease_risk': False,
        'planting_calendar': True,
        'profitability_calc': True,
        'ussd_access': True,
        'farms_allowed': 2,
        'crops_allowed': 5,
    },
    'pro': {
        'weather_forecast': True,
        'weather_days': 14,
        'crop_advisory': True,
        'market_prices': True,
        'sms_alerts': True,
        'sms_per_month': 999,          # unlimited
        'disease_risk': True,
        'planting_calendar': True,
        'profitability_calc': True,
        'ussd_access': True,
        'farms_allowed': 10,
        'crops_allowed': 50,
    }
}

def get_plan_tier(plan_name):
    """Map plan name to feature tier"""
    if not plan_name:
        return 'free'
    if 'pro' in plan_name:
        return 'pro'
    if 'basic' in plan_name or 'ngo' in plan_name or 'county' in plan_name:
        return 'basic'
    return 'free'

def get_plan_features(plan_name):
    tier = get_plan_tier(plan_name)
    return PLAN_FEATURES[tier]

def can_access_feature(plan_name, feature):
    features = get_plan_features(plan_name)
    return features.get(feature, False)
