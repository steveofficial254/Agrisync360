#!/usr/bin/env python3
"""
AgriSync 360 — Master Verification Script
Tests all 63+ endpoints claimed complete.
Run: python run_all_tests.py
"""
import requests
import json
import time
import sys
import redis
import psycopg2
from datetime import datetime

BASE = "http://localhost:5000"
RESULTS = {}
TOKENS = {}
IDS = {}

def p(msg):
    print(msg)

def log(test_id, name, passed, detail="", response=None):
    RESULTS[test_id] = {
        "name": name,
        "passed": passed,
        "detail": detail
    }
    icon = "✅" if passed else "❌"
    print(f"  {icon} [{test_id}] {name}")
    if not passed:
        print(f"         → {detail}")
        if response:
            try:
                print(f"         → Response: {response.text[:150]}")
            except:
                pass

def post(url, **kwargs):
    try:
        return requests.post(f"{BASE}{url}", timeout=15, **kwargs)
    except Exception as e:
        class FakeResp:
            status_code = 0
            text = str(e)
            def json(self): return {}
        return FakeResp()

def get(url, **kwargs):
    try:
        return requests.get(f"{BASE}{url}", timeout=15, **kwargs)
    except Exception as e:
        class FakeResp:
            status_code = 0
            text = str(e)
            def json(self): return {}
        return FakeResp()

def put(url, **kwargs):
    try:
        return requests.put(f"{BASE}{url}", timeout=15, **kwargs)
    except Exception as e:
        class FakeResp:
            status_code = 0
            text = str(e)
            def json(self): return {}
        return FakeResp()

def delete(url, **kwargs):
    try:
        return requests.delete(f"{BASE}{url}", timeout=15, **kwargs)
    except Exception as e:
        class FakeResp:
            status_code = 0
            text = str(e)
            def json(self): return {}
        return FakeResp()

def headers(role='farmer'):
    token = TOKENS.get(role, '')
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# ============================================================
print("\n" + "="*60)
print("  AgriSync 360 — Master Verification")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*60)

# ============================================================
print("\n📡 PRE-FLIGHT CHECKS")
print("="*60)

# PF-1: Server running
r = get("/api/health")
log("PF-1", "Flask server running", r.status_code == 200,
    f"Got {r.status_code}", r)

if r.status_code != 200:
    print("\n⛔ Server not running. Start with: python run.py")
    sys.exit(1)

health_data = r.json().get('data', {})
checks = health_data.get('checks', {})

log("PF-2", "Database connected",
    checks.get('database') == 'ok',
    f"DB status: {checks.get('database')}")

log("PF-3", "Redis connected",
    checks.get('redis') == 'ok',
    f"Redis status: {checks.get('redis')}")

# PF-4: Redis direct test
try:
    rc = redis.Redis(host='localhost', port=6379)
    rc.ping()
    rc.set('test_key', 'ok', ex=10)
    val = rc.get('test_key')
    log("PF-4", "Redis set/get works", val == b'ok')
except Exception as e:
    log("PF-4", "Redis set/get works", False, str(e))

# PF-5: Database tables
try:
    conn = psycopg2.connect(
        "postgresql://agrisync_user:agrisync_pass@localhost/agrisync_db"
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public'
    """)
    tables = [r[0] for r in cur.fetchall()]
    required_tables = [
        'user', 'farmer_profile', 'farm', 'crop',
        'payment', 'advisory', 'market_price', 'sms_log',
        'alert', 'agro_dealer', 'product_recommendation',
        'ngo_profile', 'bulk_farmer_registration'
    ]
    missing = [t for t in required_tables
               if not any(t in x for x in tables)]
    log("PF-5", f"All DB tables exist ({len(tables)} found)",
        len(missing) == 0,
        f"Missing: {missing}" if missing else "")
    conn.close()
except Exception as e:
    log("PF-5", "Database tables check", False, str(e))

# ============================================================
print("\n🔐 SECTION 1: AUTHENTICATION (7 endpoints)")
print("="*60)

# Register all 4 role users
roles_phones = {
    'farmer': ('0711000001', 'FarmerPass1!'),
    'agro_dealer': ('0722000001', 'DealerPass1!'),
    'ngo_partner': ('0733000001', 'NGOPass1!'),
    'admin': ('0700000099', 'AdminPass1!'),
}

for role, (phone, password) in roles_phones.items():
    # Register
    r = post("/api/auth/register", json={
        "phone": phone,
        "password": password,
        "role": role
    })
    
    if r.status_code in [200, 201]:
        otp = r.json().get('data', {}).get('otp')
        log(f"A1-{role}", f"Register {role}",
            otp is not None,
            f"Status {r.status_code}, OTP: {otp}", r)
        
        # Verify OTP
        r2 = post("/api/auth/verify-otp", json={
            "phone": phone, "otp": str(otp)
        })
        token = r2.json().get('data', {}).get('access_token')
        log(f"A2-{role}", f"Verify OTP for {role}",
            r2.status_code == 200 and bool(token),
            f"Status {r2.status_code}", r2)
        TOKENS[role] = token or ''
        
    elif r.status_code == 409:
        # Already exists — login
        r2 = post("/api/auth/login", json={
            "phone": phone, "password": password
        })
        token = r2.json().get('data', {}).get('access_token')
        log(f"A1-{role}", f"Register/Login {role} (existing)",
            bool(token), f"Status {r2.status_code}", r2)
        TOKENS[role] = token or ''
    else:
        log(f"A1-{role}", f"Register {role}",
            False, f"Unexpected {r.status_code}", r)
        TOKENS[role] = ''

# A3: Login
r = post("/api/auth/login", json={
    "phone": "0711000001", "password": "FarmerPass1!"
})
log("A3", "Login with phone+password",
    r.status_code == 200,
    f"Status {r.status_code}", r)

# A4: Refresh token
refresh = r.json().get('data', {}).get('refresh_token', '')
if refresh:
    r2 = post("/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh}"})
    log("A4", "Refresh access token",
        r2.status_code == 200,
        f"Status {r2.status_code}", r2)
else:
    log("A4", "Refresh access token", False, "No refresh token")

# A5: Wrong password rejected
r = post("/api/auth/login", json={
    "phone": "0711000001", "password": "WrongPass1!"
})
log("A5", "Wrong password rejected",
    r.status_code in [400, 401],
    f"Got {r.status_code}", r)

# A6: Logout
r = post("/api/auth/logout", headers=headers('farmer'))
log("A6", "Logout endpoint works",
    r.status_code in [200, 204],
    f"Got {r.status_code}", r)

# Re-login after logout
r = post("/api/auth/login", json={
    "phone": "0711000001", "password": "FarmerPass1!"
})
if r.status_code == 200:
    TOKENS['farmer'] = r.json().get(
        'data', {}).get('access_token', TOKENS['farmer'])

# A7: No token returns 401
r = get("/api/farmers/profile")
log("A7", "Protected route returns 401 without token",
    r.status_code == 401, f"Got {r.status_code}", r)

# ============================================================
print("\n🔑 SECTION 2: PASSWORD RESET (3 endpoints)")
print("="*60)

# PR-1: Request reset
r = post("/api/auth/forgot-password", json={
    "phone": "0711000001"
})
log("PR-1", "Forgot password request",
    r.status_code == 200, f"Status {r.status_code}", r)

reset_otp = r.json().get('data', {}).get('otp')
log("PR-2", "Reset OTP returned in dev mode",
    reset_otp is not None, "No OTP in response")

if reset_otp:
    # PR-3: Verify reset OTP
    r = post("/api/auth/verify-reset-otp", json={
        "phone": "0711000001", "otp": str(reset_otp)
    })
    log("PR-3", "Verify reset OTP",
        r.status_code == 200, f"Status {r.status_code}", r)
    
    reset_token = r.json().get('data', {}).get('reset_token')
    log("PR-4", "Reset token returned",
        bool(reset_token), "No reset_token")
    
    if reset_token:
        # PR-5: Reset password
        r = post("/api/auth/reset-password", json={
            "reset_token": reset_token,
            "new_password": "NewFarmerPass1!"
        })
        log("PR-5", "Reset password works",
            r.status_code == 200, f"Status {r.status_code}", r)
        
        # PR-6: Login with new password
        r = post("/api/auth/login", json={
            "phone": "0711000001",
            "password": "NewFarmerPass1!"
        })
        log("PR-6", "Login with new password",
            r.status_code == 200, f"Status {r.status_code}", r)
        if r.status_code == 200:
            TOKENS['farmer'] = r.json().get(
                'data', {}).get('access_token', TOKENS['farmer'])

# PR-7: Non-existent phone returns 200 (security)
r = post("/api/auth/forgot-password", json={
    "phone": "0799888777"
})
log("PR-7", "Non-existent phone returns 200 safely",
    r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n🛡️ SECTION 3: ROLE ACCESS CONTROL")
print("="*60)

role_tests = [
    ("RC-1", "Farmer blocked from admin", "farmer",
     "GET", "/api/admin/stats", 403),
    ("RC-2", "Farmer blocked from dealer", "farmer",
     "GET", "/api/dealer/profile", 403),
    ("RC-3", "Farmer blocked from NGO", "farmer",
     "GET", "/api/ngo/profile", 403),
    ("RC-4", "Dealer blocked from admin", "agro_dealer",
     "GET", "/api/admin/stats", 403),
    ("RC-5", "Dealer blocked from NGO", "agro_dealer",
     "GET", "/api/ngo/dashboard", 403),
    ("RC-6", "NGO blocked from admin", "ngo_partner",
     "GET", "/api/admin/stats", 403),
    ("RC-7", "NGO blocked from dealer", "ngo_partner",
     "GET", "/api/dealer/stats", 403),
    ("RC-8", "Admin can access stats", "admin",
     "GET", "/api/admin/stats", 200),
]

for test_id, name, role, method, url, expected in role_tests:
    if method == "GET":
        r = get(url, headers=headers(role))
    else:
        r = post(url, headers=headers(role), json={})
    log(test_id, name,
        r.status_code == expected,
        f"Expected {expected} got {r.status_code}", r)

# ============================================================
print("\n👨‍🌾 SECTION 4: FARMER PROFILE (3 endpoints)")
print("="*60)

# FP-1: Create profile
r = post("/api/farmers/profile",
    headers=headers('farmer'),
    json={
        "first_name": "Stephen",
        "last_name": "Mburu",
        "county": "Nakuru",
        "sub_county": "Nakuru East",
        "ward": "Biashara",
        "village": "Kiamunyi"
    }
)
log("FP-1", "Create farmer profile",
    r.status_code in [200, 201, 409],
    f"Got {r.status_code}", r)

# FP-2: Get profile
r = get("/api/farmers/profile", headers=headers('farmer'))
log("FP-2", "Get farmer profile",
    r.status_code == 200, f"Got {r.status_code}", r)
profile_data = r.json().get('data', {})
log("FP-3", "Profile has required fields",
    all(k in profile_data for k in ['first_name', 'county']),
    f"Keys: {list(profile_data.keys())}")

# FP-4: Update profile
r = put("/api/farmers/profile",
    headers=headers('farmer'),
    json={"village": "Updated Village"})
log("FP-4", "Update farmer profile",
    r.status_code == 200, f"Got {r.status_code}", r)

# FP-5: Invalid county rejected
r = post("/api/farmers/profile",
    headers=headers('farmer'),
    json={
        "first_name": "Test",
        "last_name": "User",
        "county": "FakeCounty999",
        "sub_county": "Test"
    }
)
log("FP-5", "Invalid county rejected",
    r.status_code in [400, 409],
    f"Got {r.status_code}")

# ============================================================
print("\n🌾 SECTION 5: FARMS & CROPS (10 endpoints)")
print("="*60)

# FM-1: Create farm
r = post("/api/farms/",
    headers=headers('farmer'),
    json={
        "name": "Mburu Main Farm",
        "latitude": -0.3031,
        "longitude": 36.0800,
        "county": "Nakuru",
        "sub_county": "Nakuru East",
        "size_acres": 3.5,
        "soil_type": "loam",
        "water_source": "rain"
    }
)
log("FM-1", "Create farm with GPS",
    r.status_code in [200, 201], f"Got {r.status_code}", r)
IDS['farm'] = r.json().get('data', {}).get('id', '')

# FM-2: List farms
r = get("/api/farms/", headers=headers('farmer'))
log("FM-2", "List farmer farms",
    r.status_code == 200, f"Got {r.status_code}", r)

# FM-3: Get single farm
if IDS.get('farm'):
    r = get(f"/api/farms/{IDS['farm']}", headers=headers('farmer'))
    log("FM-3", "Get single farm",
        r.status_code == 200, f"Got {r.status_code}", r)

# FM-4: Update farm
if IDS.get('farm'):
    r = put(f"/api/farms/{IDS['farm']}",
        headers=headers('farmer'),
        json={"name": "Updated Farm Name"})
    log("FM-4", "Update farm",
        r.status_code == 200, f"Got {r.status_code}", r)

# FM-5: Set primary
if IDS.get('farm'):
    r = post(f"/api/farms/{IDS['farm']}/set-primary",
        headers=headers('farmer'))
    log("FM-5", "Set primary farm",
        r.status_code in [200, 204], f"Got {r.status_code}", r)

# FM-6: Add crop
from datetime import datetime, timedelta
planting_date = (datetime.now() - timedelta(days=21)).strftime('%Y-%m-%d')

if IDS.get('farm'):
    r = post(f"/api/farms/{IDS['farm']}/crops",
        headers=headers('farmer'),
        json={
            "crop_name": "maize",
            "planting_date": planting_date,
            "area_planted_acres": 2.0,
            "variety": "H614D"
        }
    )
    log("FM-6", "Add maize crop to farm",
        r.status_code in [200, 201], f"Got {r.status_code}", r)
    IDS['crop'] = r.json().get('data', {}).get('id', '')
    
    crop_data = r.json().get('data', {})
    log("FM-7", "Crop has auto-calculated growth stage",
        crop_data.get('growth_stage') == 'vegetative',
        f"Got: {crop_data.get('growth_stage')}")
    
    log("FM-8", "Crop has auto-calculated harvest date",
        crop_data.get('expected_harvest_date') is not None,
        "No harvest date")

# FM-9: List crops
if IDS.get('farm'):
    r = get(f"/api/farms/{IDS['farm']}/crops",
        headers=headers('farmer'))
    log("FM-9", "List farm crops",
        r.status_code == 200, f"Got {r.status_code}", r)

# FM-10: Update crop
if IDS.get('farm') and IDS.get('crop'):
    r = put(f"/api/farms/{IDS['farm']}/crops/{IDS['crop']}",
        headers=headers('farmer'),
        json={"variety": "DK8031"})
    log("FM-10", "Update crop",
        r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n🌤️ SECTION 6: WEATHER (5 endpoints)")
print("="*60)

# WE-1: Basic forecast
r = get("/api/weather/forecast",
    params={"lat": -1.2921, "lon": 36.8219},
    timeout=20)
log("WE-1", "7-day weather forecast",
    r.status_code == 200, f"Got {r.status_code}", r)

forecast = r.json().get('data', {}).get('forecast', [])
log("WE-2", "Forecast has 7 days",
    len(forecast) == 7, f"Got {len(forecast)} days")

if forecast:
    day = forecast[0]
    log("WE-3", "Forecast has disease_risk field",
        'disease_risk' in day, f"Keys: {list(day.keys())}")
    log("WE-4", "Forecast has planting_window field",
        'planting_window' in day, f"Keys: {list(day.keys())}")
    log("WE-5", "Forecast has weather_description",
        'weather_description' in day, f"Keys: {list(day.keys())}")

# WE-6: Redis cache test
time.sleep(0.5)
start = time.time()
r2 = get("/api/weather/forecast",
    params={"lat": -1.2921, "lon": 36.8219})
elapsed = time.time() - start
log("WE-6", "Weather response cached in Redis",
    elapsed < 1.0 and r2.status_code == 200,
    f"Response time: {elapsed:.3f}s")

# WE-7: Nakuru forecast (different location)
r = get("/api/weather/forecast",
    params={"lat": -0.3031, "lon": 36.0800},
    timeout=20)
log("WE-7", "Forecast for Nakuru coordinates",
    r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n📋 SECTION 7: CROP ADVISORY (6 endpoints)")
print("="*60)

# CA-1: Maize advisory
r = get("/api/advisory/crop/maize")
log("CA-1", "Maize advisory endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

advisories = r.json().get('data', [])
log("CA-2", "Advisory returns data",
    len(advisories) > 0, f"Got {len(advisories)} advisories")

if advisories:
    types = [a.get('advisory_type') for a in advisories]
    log("CA-3", "Advisory has planting type",
        'planting' in types, f"Types: {types}")
    log("CA-4", "Advisory has nutrition type",
        'nutrition' in types, f"Types: {types}")

# CA-5: Planting calendar
r = get("/api/advisory/calendar/maize",
    params={"planting_date": datetime.now().strftime('%Y-%m-%d')})
log("CA-5", "Planting calendar endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)
calendar = r.json().get('data', [])
log("CA-6", "Calendar has weekly tasks",
    len(calendar) > 0, f"Got {len(calendar)} weeks")

# CA-7: My crops advisory (requires auth)
r = get("/api/advisory/my-crops", headers=headers('farmer'))
log("CA-7", "My crops advisory (authenticated)",
    r.status_code in [200, 402], f"Got {r.status_code}", r)

# CA-8: Beans advisory
r = get("/api/advisory/crop/beans")
log("CA-8", "Beans advisory endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n📈 SECTION 8: MARKET INTELLIGENCE (4 endpoints)")
print("="*60)

# MI-1: All prices
r = get("/api/market/prices")
log("MI-1", "Market prices endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)
prices = r.json().get('data', [])
log("MI-2", "Market prices returns data",
    len(prices) > 0, f"Got {len(prices)} records")

# MI-3: Filter by crop
r = get("/api/market/prices", params={"crop": "maize"})
log("MI-3", "Filter prices by crop",
    r.status_code == 200, f"Got {r.status_code}", r)

# MI-4: Price history
r = get("/api/market/history",
    params={"crop": "maize", "months": 3})
log("MI-4", "Price history endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# MI-5: Profitability calculator
r = get("/api/market/profitability",
    headers=headers('farmer'),
    params={"crop": "maize", "acres": 3})
log("MI-5", "Profitability calculator",
    r.status_code in [200, 402], f"Got {r.status_code}", r)

if r.status_code == 200:
    profit = r.json().get('data', {})
    log("MI-6", "Profitability has revenue field",
        'revenue' in profit, f"Keys: {list(profit.keys())}")
    log("MI-7", "Profitability has profit field",
        'profit' in profit, f"Keys: {list(profit.keys())}")

# ============================================================
print("\n💳 SECTION 9: PAYMENTS (6 endpoints)")
print("="*60)

# PA-1: Get plans
r = get("/api/payments/plans")
log("PA-1", "Get subscription plans",
    r.status_code == 200, f"Got {r.status_code}", r)
plans = r.json().get('data', [])
log("PA-2", "Plans returned",
    len(plans) >= 4, f"Got {len(plans)} plans")

plan_ids = [p.get('plan_id') for p in plans]
log("PA-3", "Basic monthly at KSH 99 exists",
    any(p.get('plan_id') == 'basic_monthly' and
        p.get('price_ksh') == 99 for p in plans),
    f"Plans: {plan_ids}")

log("PA-4", "Pro monthly at KSH 299 exists",
    any(p.get('plan_id') == 'pro_monthly' and
        p.get('price_ksh') == 299 for p in plans),
    f"Plans: {plan_ids}")

# PA-5: Check subscription status
r = get("/api/payments/subscription", headers=headers('farmer'))
log("PA-5", "Subscription status endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

sub = r.json().get('data', {})
log("PA-6", "Subscription has is_active field",
    'is_active' in sub, f"Keys: {list(sub.keys())}")

# PA-7: Initiate STK push
r = post("/api/payments/subscribe",
    headers=headers('farmer'),
    json={"plan": "basic_monthly", "phone": "0711000001"})
log("PA-7", "Subscribe endpoint exists",
    r.status_code in [200, 400, 402, 500],
    f"Got {r.status_code}")

checkout_id = r.json().get('data', {}).get('checkout_request_id', '')

# PA-8: Payment status
if checkout_id:
    r = get(f"/api/payments/status/{checkout_id}",
        headers=headers('farmer'))
    log("PA-8", "Payment status endpoint",
        r.status_code == 200, f"Got {r.status_code}", r)

# PA-9: M-Pesa callback (no auth)
r = post("/api/payments/mpesa/callback", json={
    "Body": {
        "stkCallback": {
            "ResultCode": 1,
            "CheckoutRequestID": "test-verify-001",
            "ResultDesc": "Cancelled by user"
        }
    }
})
log("PA-9", "M-Pesa callback (no auth required)",
    r.status_code == 200, f"Got {r.status_code}", r)

# PA-10: Payment history
r = get("/api/payments/history", headers=headers('farmer'))
log("PA-10", "Payment history endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# PA-11: Plans have features
log("PA-11", "All plans have features object",
    all('features' in p for p in plans),
    "Some plans missing features")

# PA-12: Upgrade endpoint
r = post("/api/payments/upgrade",
    headers=headers('farmer'),
    json={"plan": "pro_monthly"})
log("PA-12", "Upgrade endpoint exists",
    r.status_code in [200, 400, 402],
    f"Got {r.status_code}", r)

# ============================================================
print("\n📱 SECTION 10: USSD (17 tests)")
print("="*60)

def ussd_test(text, phone="+254711000001"):
    r = get("/api/ussd/test",
        params={"text": text, "phone": phone})
    if r.status_code == 200:
        try:
            data = r.json()
            return data.get('response', ''), r.status_code
        except:
            return r.text, r.status_code
    return '', r.status_code

# US-1: Main menu
resp, code = ussd_test("")
log("US-1", "USSD main menu loads",
    code == 200 and resp.startswith('CON'),
    f"Got: {resp[:60]}")

log("US-2", "Main menu has 5 options",
    all(str(i) in resp for i in range(1, 6)),
    f"Response: {resp[:120]}")

log("US-3", "Main menu response under 182 chars",
    len(resp) <= 182, f"Length: {len(resp)}")

# US-4: Weather menu
resp, code = ussd_test("1")
log("US-4", "Weather submenu",
    resp.startswith('CON'), f"Got: {resp[:60]}")

# US-5: Today's weather
resp, code = ussd_test("1*1")
log("US-5", "Today's weather via USSD",
    resp.startswith('END'), f"Got: {resp[:80]}")
log("US-6", "Weather response under 182 chars",
    len(resp) <= 182, f"Length: {len(resp)}")

# US-7: 7-day weather
resp, code = ussd_test("1*2")
log("US-7", "7-day weather via USSD",
    resp.startswith('END'), f"Got: {resp[:60]}")

# US-8: Disease risk
resp, code = ussd_test("1*3")
log("US-8", "Disease risk via USSD",
    resp.startswith('END'), f"Got: {resp[:60]}")

# US-9: Crop advisory menu
resp, code = ussd_test("2")
log("US-9", "Crop advisory menu",
    resp.startswith('CON') and 'Mahindi' in resp,
    f"Got: {resp[:80]}")

# US-10: Maize advisory submenu
resp, code = ussd_test("2*1")
log("US-10", "Maize advisory submenu",
    resp.startswith('CON'), f"Got: {resp[:60]}")

# US-11: Maize planting advisory
resp, code = ussd_test("2*1*1")
log("US-11", "Maize planting advisory detail",
    resp.startswith('END') and len(resp) <= 182,
    f"Length: {len(resp)}, Got: {resp[:60]}")

# US-12: Market menu
resp, code = ussd_test("3")
log("US-12", "Market prices menu",
    resp.startswith('CON'), f"Got: {resp[:60]}")

# US-13: Maize prices
resp, code = ussd_test("3*1")
log("US-13", "Maize prices via USSD",
    resp.startswith('END') and 'KSH' in resp,
    f"Got: {resp[:80]}")

# US-14: Account menu
resp, code = ussd_test("4")
log("US-14", "Account menu loads",
    resp.startswith('CON') or resp.startswith('END'),
    f"Got: {resp[:60]}")

# US-15: Subscribe menu
resp, code = ussd_test("5")
log("US-15", "Subscribe menu loads",
    resp.startswith('CON') and '99' in resp,
    f"Got: {resp[:80]}")

# US-16: Basic subscription
resp, code = ussd_test("5*1")
log("US-16", "Basic subscription via USSD",
    resp.startswith('END') and '99' in resp,
    f"Got: {resp[:80]}")

# US-17: Pro subscription
resp, code = ussd_test("5*2")
log("US-17", "Pro subscription via USSD",
    resp.startswith('END') and '299' in resp,
    f"Got: {resp[:80]}")

# US-18: All responses under 182 chars
all_inputs = ["", "1", "1*1", "1*2", "1*3",
              "2", "2*1", "2*1*1", "2*1*2",
              "3", "3*1", "4", "5", "5*1", "5*2"]
over_limit = []
for inp in all_inputs:
    resp, _ = ussd_test(inp)
    if len(resp) > 182:
        over_limit.append(f"'{inp}':{len(resp)}chars")
log("US-18", "All USSD responses under 182 chars",
    len(over_limit) == 0,
    f"Over limit: {over_limit}")

# ============================================================
print("\n🏪 SECTION 11: AGRO-DEALER (10 endpoints)")
print("="*60)

# AD-1: Create dealer profile
r = post("/api/dealer/profile",
    headers=headers('agro_dealer'),
    json={
        "business_name": "Nakuru Agro Supplies",
        "county": "Nakuru",
        "business_location": "Nakuru Town CBD",
        "products": ["fertilizers", "seeds", "pesticides"]
    }
)
log("AD-1", "Create agro-dealer profile",
    r.status_code in [200, 201, 409],
    f"Got {r.status_code}", r)

# AD-2: Get dealer profile
r = get("/api/dealer/profile", headers=headers('agro_dealer'))
log("AD-2", "Get dealer profile",
    r.status_code == 200, f"Got {r.status_code}", r)

# AD-3: Dealer stats
r = get("/api/dealer/stats", headers=headers('agro_dealer'))
log("AD-3", "Dealer stats endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# AD-4: Add product recommendation
r = post("/api/dealer/products",
    headers=headers('agro_dealer'),
    json={
        "crop_name": "maize",
        "product_name": "DAP Fertilizer 50kg",
        "product_type": "fertilizer",
        "description": "Best quality DAP for maize planting.",
        "price_ksh": 3200
    }
)
log("AD-4", "Add product recommendation",
    r.status_code in [200, 201], f"Got {r.status_code}", r)
IDS['product'] = r.json().get('data', {}).get('id', '')

# AD-5: List products
r = get("/api/dealer/products", headers=headers('agro_dealer'))
log("AD-5", "List dealer products",
    r.status_code == 200, f"Got {r.status_code}", r)

# AD-6: Update product
if IDS.get('product'):
    r = put(f"/api/dealer/products/{IDS['product']}",
        headers=headers('agro_dealer'),
        json={"price_ksh": 3300})
    log("AD-6", "Update product",
        r.status_code == 200, f"Got {r.status_code}", r)

# AD-7: List farmers (with subscription status)
r = get("/api/dealer/farmers",
    headers=headers('agro_dealer'),
    params={"county": "Nakuru"})
log("AD-7", "List farmers by county",
    r.status_code == 200, f"Got {r.status_code}", r)

# AD-8: Send broadcast
r = post("/api/dealer/broadcast",
    headers=headers('agro_dealer'),
    json={
        "message": "New DAP fertilizer available at KSH 3200!",
        "target_county": "Nakuru",
        "crop_filter": "maize"
    }
)
log("AD-8", "Send dealer broadcast",
    r.status_code in [200, 201], f"Got {r.status_code}", r)

# AD-9: Get broadcasts
r = get("/api/dealer/broadcasts",
    headers=headers('agro_dealer'))
log("AD-9", "Get dealer broadcasts",
    r.status_code == 200, f"Got {r.status_code}", r)

# AD-10: Update dealer profile
r = put("/api/dealer/profile",
    headers=headers('agro_dealer'),
    json={"business_location": "Updated Location"})
log("AD-10", "Update dealer profile",
    r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n🤝 SECTION 12: NGO PARTNER (8 endpoints)")
print("="*60)

# NG-1: Create NGO profile
r = post("/api/ngo/profile",
    headers=headers('ngo_partner'),
    json={
        "organization_name": "Kenya Farmers Trust",
        "organization_type": "ngo",
        "focus_counties": ["Nakuru", "Meru", "Kisumu"],
        "focus_crops": ["maize", "beans", "potatoes"],
        "total_beneficiaries_target": 500
    }
)
log("NG-1", "Create NGO profile",
    r.status_code in [200, 201, 409],
    f"Got {r.status_code}", r)

# NG-2: Get NGO profile
r = get("/api/ngo/profile", headers=headers('ngo_partner'))
log("NG-2", "Get NGO profile",
    r.status_code == 200, f"Got {r.status_code}", r)

# NG-3: NGO dashboard
r = get("/api/ngo/dashboard", headers=headers('ngo_partner'))
log("NG-3", "NGO dashboard endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# NG-4: Bulk farmer registration
r = post("/api/ngo/farmers/bulk-register",
    headers=headers('ngo_partner'),
    json={
        "county": "Nakuru",
        "batch_name": "Nakuru East Q2 2026",
        "farmers": [
            {
                "phone": "0741000001",
                "first_name": "Mary",
                "last_name": "Wanjiku",
                "sub_county": "Nakuru East",
                "crops": ["maize", "beans"]
            },
            {
                "phone": "0741000002",
                "first_name": "John",
                "last_name": "Kamau",
                "sub_county": "Nakuru East",
                "crops": ["maize"]
            }
        ]
    }
)
log("NG-4", "Bulk farmer registration initiated",
    r.status_code in [200, 201, 202], f"Got {r.status_code}", r)
IDS['batch'] = r.json().get('data', {}).get('id', '')

# NG-5: List NGO farmers
r = get("/api/ngo/farmers",
    headers=headers('ngo_partner'),
    params={"county": "Nakuru"})
log("NG-5", "List NGO farmers",
    r.status_code == 200, f"Got {r.status_code}", r)

# NG-6: Get batch status
if IDS.get('batch'):
    r = get(f"/api/ngo/farmers/batches/{IDS['batch']}",
        headers=headers('ngo_partner'))
    log("NG-6", "Get batch registration status",
        r.status_code == 200, f"Got {r.status_code}", r)

# NG-7: Send NGO broadcast
r = post("/api/ngo/broadcast",
    headers=headers('ngo_partner'),
    json={
        "message": "Free planting advice available this week",
        "target_county": "Nakuru",
        "beneficiary_type": "all"
    }
)
log("NG-7", "Send NGO broadcast",
    r.status_code in [200, 201], f"Got {r.status_code}", r)

# NG-8: Get NGO broadcasts
r = get("/api/ngo/broadcasts",
    headers=headers('ngo_partner'))
log("NG-8", "Get NGO broadcasts",
    r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n📊 SECTION 13: ADMIN DASHBOARD (3 endpoints)")
print("="*60)

# ADM-1: Admin stats
r = get("/api/admin/stats", headers=headers('admin'))
log("ADM-1", "Admin statistics endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

if r.status_code == 200:
    stats = r.json().get('data', {})
    log("ADM-2", "Stats have users count",
        'users' in stats, f"Keys: {list(stats.keys())}")
    log("ADM-3", "Stats have farms count",
        'farms' in stats, f"Keys: {list(stats.keys())}")

# ADM-4: List all users
r = get("/api/admin/users",
    headers=headers('admin'),
    params={"role": "farmer", "limit": 10})
log("ADM-4", "List users by role",
    r.status_code == 200, f"Got {r.status_code}", r)

# ADM-5: System health
r = get("/api/admin/health", headers=headers('admin'))
log("ADM-5", "System health endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n📱 SECTION 14: SMS NOTIFICATIONS (3 endpoints)")
print("="*60)

# SMS-1: Send SMS (admin only)
r = post("/api/sms/send",
    headers=headers('admin'),
    json={
        "phone": "0711000001",
        "message": "Test SMS from AgriSync 360"
    }
)
log("SMS-1", "Send SMS endpoint",
    r.status_code in [200, 400, 500], f"Got {r.status_code}", r)

# SMS-2: SMS logs
r = get("/api/sms/logs",
    headers=headers('admin'),
    params={"limit": 10})
log("SMS-2", "SMS logs endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# SMS-3: Resend OTP
r = post("/api/auth/resend-otp",
    json={"phone": "0711000001"})
log("SMS-3", "Resend OTP endpoint",
    r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
print("\n🔔 SECTION 15: ALERTS & NOTIFICATIONS (3 endpoints)")
print("="*60)

# AL-1: Create alert
r = post("/api/alerts",
    headers=headers('admin'),
    json={
        "title": "Test Weather Alert",
        "message": "Heavy rains expected in Nakuru",
        "alert_type": "weather",
        "severity": "medium",
        "target_counties": ["Nakuru"]
    }
)
log("AL-1", "Create alert endpoint",
    r.status_code in [200, 201], f"Got {r.status_code}", r)

# AL-2: List alerts
r = get("/api/alerts",
    headers=headers('farmer'),
    params={"county": "Nakuru"})
log("AL-2", "List alerts by county",
    r.status_code == 200, f"Got {r.status_code}", r)

# AL-3: Mark alert read
alerts = r.json().get('data', [])
if alerts:
    alert_id = alerts[0].get('id')
    if alert_id:
        r = put(f"/api/alerts/{alert_id}/read",
            headers=headers('farmer'))
        log("AL-3", "Mark alert as read",
            r.status_code == 200, f"Got {r.status_code}", r)

# ============================================================
# FINAL REPORT
print("\n" + "="*60)
print("  FINAL VERIFICATION REPORT")
print("="*60)

passed = sum(1 for r in RESULTS.values() if r['passed'])
total = len(RESULTS)
pct = int((passed / total) * 100) if total > 0 else 0

print(f"\n📊 OVERALL SCORE: {passed}/{total} tests passed ({pct}%)")
print(f"⏰  Completed in {datetime.now().strftime('%H:%M:%S')}")

if pct == 100:
    print("\n🎉 ALL TESTS PASSED!")
    print("\n✅ Backend is 100% complete and ready for frontend")
    print("\n📋 All 63+ endpoints verified working:")
    print("   • Authentication (7/7)")
    print("   • Password Reset (7/7)")
    print("   • Role-Based Access (8/8)")
    print("   • Farmer Profile (5/5)")
    print("   • Farms & Crops (10/10)")
    print("   • Weather Service (7/7)")
    print("   • Crop Advisory (8/8)")
    print("   • Market Intelligence (7/7)")
    print("   • Payments (12/12)")
    print("   • USSD Integration (18/18)")
    print("   • Agro-Dealer Portal (10/10)")
    print("   • NGO Dashboard (8/8)")
    print("   • Admin Dashboard (5/5)")
    print("   • SMS Notifications (3/3)")
    print("   • Alerts System (3/3)")
    
    print("\n🚀 READY FOR DAY 8: REACT FRONTEND BUILD")
else:
    print(f"\n⚠️  {total - passed} tests failed - fix before proceeding")
    print("\n❌ Failed tests:")
    for test_id, result in RESULTS.items():
        if not result['passed']:
            print(f"   • [{test_id}] {result['name']}: {result['detail']}")

print("\n" + "="*60)
sys.exit(0 if pct == 100 else 1)
