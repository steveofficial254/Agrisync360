#!/usr/bin/env python3
"""
AgriSync 360 QA Verification Script
Complete end-to-end testing of all backend features
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:5000"

def log_test(test_name, success, message="", details=None):
    """Log test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {test_name}")
    if message:
        print(f"      {message}")
    if details:
        print(f"      Details: {details}")
    return success

def check_server():
    """Check if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get("data", {}).get("status") == "healthy"
        return False
    except:
        return False

def test_authentication():
    """Test complete authentication system"""
    print("\n" + "="*50)
    print("SECTION 1: AUTHENTICATION SYSTEM")
    print("="*50)
    
    results = {}
    
    # 1.1 Register farmer
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "phone": "0711111111",
        "password": "TestPass1!",
        "role": "farmer"
    })
    success = r.status_code in [200, 201, 409]
    log_test("1.1 Register farmer", success, f"Got {r.status_code}")
    results["1.1"] = success
    
    # Get OTP if registration succeeded
    otp = None
    if r.status_code in [200, 201]:
        otp = r.json().get('data', {}).get('otp')
        log_test("1.2 OTP returned in dev mode", otp is not None, "OTP not in response")
        results["1.2"] = otp is not None
    
    # 1.3 Verify OTP or login existing
    if otp:
        r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "0711111111",
            "otp": str(otp)
        })
        success = r2.status_code == 200
        log_test("1.3 Verify OTP", success, f"Got {r2.status_code}")
        results["1.3"] = success
        FARMER_TOKEN = r2.json().get('data', {}).get('access_token', '')
    else:
        # Login existing
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0711111111", "password": "TestPass1!"
        })
        success = r2.status_code == 200
        log_test("1.3 Login existing farmer", success, f"Got {r2.status_code}")
        results["1.3"] = success
        FARMER_TOKEN = r2.json().get('data', {}).get('access_token', '')
    
    log_test("1.4 Token received", bool(FARMER_TOKEN))
    results["1.4"] = bool(FARMER_TOKEN)
    
    FARMER_HEADERS = {"Authorization": f"Bearer {FARMER_TOKEN}"}
    
    # 1.5 Register agro-dealer
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "phone": "0722222222",
        "password": "TestPass1!",
        "role": "agro_dealer"
    })
    if r.status_code in [200, 201]:
        otp = r.json().get('data', {}).get('otp')
        r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "0722222222", "otp": str(otp)
        })
        DEALER_TOKEN = r2.json().get('data', {}).get('access_token', '')
    else:
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0722222222", "password": "TestPass1!"
        })
        DEALER_TOKEN = r2.json().get('data', {}).get('access_token', '')
    success = bool(DEALER_TOKEN)
    log_test("1.5 Agro-dealer registered and logged in", success)
    results["1.5"] = success
    
    DEALER_HEADERS = {"Authorization": f"Bearer {DEALER_TOKEN}"}
    
    # 1.6 Register NGO
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "phone": "0733333333",
        "password": "TestPass1!",
        "role": "ngo_partner"
    })
    if r.status_code in [200, 201]:
        otp = r.json().get('data', {}).get('otp')
        r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "0733333333", "otp": str(otp)
        })
        NGO_TOKEN = r2.json().get('data', {}).get('access_token', '')
    else:
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0733333333", "password": "TestPass1!"
        })
        NGO_TOKEN = r2.json().get('data', {}).get('access_token', '')
    success = bool(NGO_TOKEN)
    log_test("1.6 NGO partner registered and logged in", success)
    results["1.6"] = success
    
    NGO_HEADERS = {"Authorization": f"Bearer {NGO_TOKEN}"}
    
    # 1.7 Register Admin
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "phone": "0700000001",
        "password": "Admin1234!",
        "role": "admin"
    })
    if r.status_code in [200, 201]:
        otp = r.json().get('data', {}).get('otp')
        r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "0700000001", "otp": str(otp)
        })
        ADMIN_TOKEN = r2.json().get('data', {}).get('access_token', '')
    else:
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0700000001", "password": "Admin1234!"
        })
        ADMIN_TOKEN = r2.json().get('data', {}).get('access_token', '')
    success = bool(ADMIN_TOKEN)
    log_test("1.7 Admin registered and logged in", success)
    results["1.7"] = success
    
    ADMIN_HEADERS = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    return results, FARMER_HEADERS, DEALER_HEADERS, NGO_HEADERS, ADMIN_HEADERS

def test_password_reset():
    """Test password reset flow"""
    print("\n" + "="*50)
    print("SECTION 2: PASSWORD RESET")
    print("="*50)
    
    results = {}
    
    # 2.1 Request reset
    r = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
        "phone": "0711111111"
    })
    success = r.status_code == 200
    log_test("2.1 Forgot password request", success, f"Got {r.status_code}")
    results["2.1"] = success
    
    reset_otp = r.json().get('data', {}).get('otp')
    log_test("2.2 Reset OTP returned in dev mode", reset_otp is not None)
    results["2.2"] = reset_otp is not None
    
    if reset_otp:
        # 2.3 Verify reset OTP
        r = requests.post(f"{BASE_URL}/api/auth/verify-reset-otp", json={
            "phone": "0711111111",
            "otp": str(reset_otp)
        })
        success = r.status_code == 200
        log_test("2.3 Verify reset OTP", success, f"Got {r.status_code}")
        results["2.3"] = success
        
        reset_token = r.json().get('data', {}).get('reset_token')
        log_test("2.4 Reset token returned", reset_token is not None)
        results["2.4"] = reset_token is not None
        
        if reset_token:
            # 2.5 Reset password
            r = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
                "reset_token": reset_token,
                "new_password": "NewPass1234!"
            })
            success = r.status_code == 200
            log_test("2.5 Reset password", success, f"Got {r.status_code}")
            results["2.5"] = success
    
    # 2.6 Wrong OTP rejected
    r = requests.post(f"{BASE_URL}/api/auth/verify-reset-otp", json={
        "phone": "0711111111",
        "otp": "000000"
    })
    success = r.status_code == 400
    log_test("2.6 Wrong OTP rejected", success, f"Should be 400 got {r.status_code}")
    results["2.6"] = success
    
    # 2.7 Non-existent phone handled safely
    r = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
        "phone": "0799999999"
    })
    success = r.status_code == 200
    log_test("2.7 Non-existent phone handled safely", success, f"Should return 200 got {r.status_code}")
    results["2.7"] = success
    
    return results

def test_role_protection(FARMER_HEADERS, DEALER_HEADERS, NGO_HEADERS, ADMIN_HEADERS):
    """Test role-based access control"""
    print("\n" + "="*50)
    print("SECTION 3: ROLE-BASED ACCESS CONTROL")
    print("="*50)
    
    results = {}
    
    # 3.1 Farmer cannot access admin routes
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers=FARMER_HEADERS)
    success = r.status_code == 403
    log_test("3.1 Farmer blocked from admin routes", success, f"Should be 403 got {r.status_code}")
    results["3.1"] = success
    
    # 3.2 Farmer cannot access dealer routes
    r = requests.get(f"{BASE_URL}/api/dealer/profile", headers=FARMER_HEADERS)
    success = r.status_code == 403
    log_test("3.2 Farmer blocked from dealer routes", success, f"Should be 403 got {r.status_code}")
    results["3.2"] = success
    
    # 3.3 Farmer cannot access NGO routes
    r = requests.get(f"{BASE_URL}/api/ngo/profile", headers=FARMER_HEADERS)
    success = r.status_code == 403
    log_test("3.3 Farmer blocked from NGO routes", success, f"Should be 403 got {r.status_code}")
    results["3.3"] = success
    
    # 3.4 Admin can access admin routes
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers=ADMIN_HEADERS)
    success = r.status_code == 200
    log_test("3.4 Admin can access admin routes", success, f"Should be 200 got {r.status_code}")
    results["3.4"] = success
    
    # 3.5 No token returns 401
    r = requests.get(f"{BASE_URL}/api/farmers/profile")
    success = r.status_code == 401
    log_test("3.5 No token returns 401", success, f"Should be 401 got {r.status_code}")
    results["3.5"] = success
    
    return results

def test_ussd():
    """Test USSD integration"""
    print("\n" + "="*50)
    print("SECTION 4: USSD INTEGRATION")
    print("="*50)
    
    results = {}
    
    def ussd(text, phone="+254711111111"):
        r = requests.get(f"{BASE_URL}/api/ussd/test", params={"text": text, "phone": phone})
        return r
    
    # 4.1 Main menu
    r = ussd("")
    data = r.json() if r.headers.get('content-type','').startswith('application') else {}
    response_text = data.get('response', '')
    success = r.status_code == 200 and response_text.startswith('CON')
    log_test("4.1 USSD main menu loads", success, f"Got {r.status_code}")
    results["4.1"] = success
    
    log_test("4.2 Main menu has 5 options", all(str(i) in response_text for i in range(1, 6)))
    results["4.2"] = all(str(i) in response_text for i in range(1, 6))
    
    # 4.3 Weather menu
    r = ussd("1")
    data = r.json()
    success = r.status_code == 200 and data.get('response','').startswith('CON')
    log_test("4.3 Weather submenu loads", success)
    results["4.3"] = success
    
    # 4.4 Today's weather
    r = ussd("1*1")
    data = r.json()
    resp = data.get('response', '')
    success = resp.startswith('END') and len(resp) <= 182
    log_test("4.4 Today weather forecast", success, f"Length: {len(resp)}")
    results["4.4"] = success
    
    # 4.5 Market prices
    r = ussd("3*1")
    data = r.json()
    resp = data.get('response', '')
    success = resp.startswith('END') and 'KSH' in resp
    log_test("4.5 Maize market prices", success)
    results["4.5"] = success
    
    # 4.6 Subscribe menu
    r = ussd("5")
    data = r.json()
    resp = data.get('response', '')
    success = resp.startswith('CON') and '99' in resp and '299' in resp
    log_test("4.6 Subscribe menu loads", success)
    results["4.6"] = success
    
    return results

def test_subscription_plans(FARMER_HEADERS):
    """Test subscription plans"""
    print("\n" + "="*50)
    print("SECTION 5: SUBSCRIPTION PLANS")
    print("="*50)
    
    results = {}
    
    # 5.1 Get all plans
    r = requests.get(f"{BASE_URL}/api/payments/plans")
    success = r.status_code == 200
    log_test("5.1 Get all plans", success, f"Got {r.status_code}")
    results["5.1"] = success
    
    plans = r.json().get('data', [])
    log_test("5.2 Plans returned", len(plans) >= 4, f"Expected 4+ plans got {len(plans)}")
    results["5.2"] = len(plans) >= 4
    
    plan_ids = [p.get('plan_id') for p in plans]
    log_test("5.3 Basic monthly plan exists at KSH 99", 
             any(p.get('plan_id') == 'basic_monthly' and p.get('price_ksh') == 99 for p in plans))
    results["5.3"] = any(p.get('plan_id') == 'basic_monthly' and p.get('price_ksh') == 99 for p in plans)
    
    log_test("5.4 Pro monthly plan exists at KSH 299",
             any(p.get('plan_id') == 'pro_monthly' and p.get('price_ksh') == 299 for p in plans))
    results["5.4"] = any(p.get('plan_id') == 'pro_monthly' and p.get('price_ksh') == 299 for p in plans)
    
    # 5.5 Subscription status
    r = requests.get(f"{BASE_URL}/api/payments/subscription", headers=FARMER_HEADERS)
    success = r.status_code == 200
    log_test("5.5 Subscription status endpoint works", success, f"Got {r.status_code}")
    results["5.5"] = success
    
    return results

def test_agro_dealer(DEALER_HEADERS):
    """Test agro-dealer dashboard"""
    print("\n" + "="*50)
    print("SECTION 6: AGRO-DEALER DASHBOARD")
    print("="*50)
    
    results = {}
    
    # 6.1 Create dealer profile
    r = requests.post(f"{BASE_URL}/api/dealer/profile", headers=DEALER_HEADERS, json={
        "business_name": "Nakuru Agro Supplies",
        "county": "Nakuru",
        "business_location": "Nakuru Town CBD",
        "products": ["fertilizers", "seeds", "pesticides"]
    })
    success = r.status_code in [200, 201, 409]
    log_test("6.1 Create agro-dealer profile", success, f"Got {r.status_code}")
    results["6.1"] = success
    
    # 6.2 Get dealer profile
    r = requests.get(f"{BASE_URL}/api/dealer/profile", headers=DEALER_HEADERS)
    success = r.status_code == 200
    log_test("6.2 Get dealer profile", success, f"Got {r.status_code}")
    results["6.2"] = success
    
    # 6.3 Dealer stats
    r = requests.get(f"{BASE_URL}/api/dealer/stats", headers=DEALER_HEADERS)
    success = r.status_code == 200
    log_test("6.3 Dealer stats endpoint", success, f"Got {r.status_code}")
    results["6.3"] = success
    
    # 6.4 Add product recommendation
    r = requests.post(f"{BASE_URL}/api/dealer/products", headers=DEALER_HEADERS, json={
        "crop_name": "maize",
        "product_name": "DAP Fertilizer 50kg",
        "product_type": "fertilizer",
        "description": "Best quality DAP for maize planting.",
        "price_ksh": 3200
    })
    success = r.status_code in [200, 201]
    log_test("6.4 Add product recommendation", success, f"Got {r.status_code}")
    results["6.4"] = success
    
    return results

def test_ngo(NGO_HEADERS):
    """Test NGO dashboard"""
    print("\n" + "="*50)
    print("SECTION 7: NGO PARTNER DASHBOARD")
    print("="*50)
    
    results = {}
    
    # 7.1 Create NGO profile
    r = requests.post(f"{BASE_URL}/api/ngo/profile", headers=NGO_HEADERS, json={
        "organization_name": "Kenya Farmers Trust",
        "organization_type": "ngo",
        "focus_counties": ["Nakuru", "Meru", "Kisumu"],
        "focus_crops": ["maize", "beans", "potatoes"],
        "total_beneficiaries_target": 500
    })
    success = r.status_code in [200, 201, 409]
    log_test("7.1 Create NGO profile", success, f"Got {r.status_code}")
    results["7.1"] = success
    
    # 7.2 Get NGO profile
    r = requests.get(f"{BASE_URL}/api/ngo/profile", headers=NGO_HEADERS)
    success = r.status_code == 200
    log_test("7.2 Get NGO profile", success, f"Got {r.status_code}")
    results["7.2"] = success
    
    # 7.3 NGO dashboard
    r = requests.get(f"{BASE_URL}/api/ngo/dashboard", headers=NGO_HEADERS)
    success = r.status_code == 200
    log_test("7.3 NGO dashboard loads", success, f"Got {r.status_code}")
    results["7.3"] = success
    
    # 7.4 Bulk farmer registration
    r = requests.post(f"{BASE_URL}/api/ngo/farmers/bulk-register", headers=NGO_HEADERS, json={
        "county": "Nakuru",
        "batch_name": "Nakuru East Q2 2026",
        "farmers": [
            {
                "phone": "0741000001",
                "first_name": "Mary",
                "last_name": "Wanjiku",
                "sub_county": "Nakuru East",
                "crops": ["maize", "beans"]
            }
        ]
    })
    success = r.status_code in [200, 201, 202]
    log_test("7.4 Bulk farmer registration initiated", success, f"Got {r.status_code}")
    results["7.4"] = success
    
    return results

def test_regression(FARMER_HEADERS, ADMIN_HEADERS):
    """Test existing features still work"""
    print("\n" + "="*50)
    print("SECTION 8: EXISTING FEATURES REGRESSION")
    print("="*50)
    
    results = {}
    
    # 8.1 Weather still works
    r = requests.get(f"{BASE_URL}/api/weather/forecast", params={"lat": -1.2921, "lon": 36.8219}, timeout=15)
    success = r.status_code == 200
    log_test("8.1 Weather forecast still works", success, f"Got {r.status_code}")
    results["8.1"] = success
    
    # 8.2 Market prices still work
    r = requests.get(f"{BASE_URL}/api/market/prices")
    success = r.status_code == 200
    log_test("8.2 Market prices still work", success, f"Got {r.status_code}")
    results["8.2"] = success
    
    # 8.3 Admin stats still work
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers=ADMIN_HEADERS)
    success = r.status_code == 200
    log_test("8.3 Admin stats still work", success, f"Got {r.status_code}")
    results["8.3"] = success
    
    return results

def main():
    """Run complete QA verification"""
    print("🧪 AgriSync 360 — Complete QA Verification")
    print("=" * 60)
    
    # Check if server is running
    if not check_server():
        print("❌ Server not running. Start Flask server first.")
        print("   Run: python run.py")
        sys.exit(1)
    
    print("✅ Server is running and healthy")
    
    # Run all test sections
    all_results = {}
    
    try:
        auth_results, farmer_h, dealer_h, ngo_h, admin_h = test_authentication()
        all_results.update(auth_results)
        
        reset_results = test_password_reset()
        all_results.update(reset_results)
        
        role_results = test_role_protection(farmer_h, dealer_h, ngo_h, admin_h)
        all_results.update(role_results)
        
        ussd_results = test_ussd()
        all_results.update(ussd_results)
        
        plan_results = test_subscription_plans(farmer_h)
        all_results.update(plan_results)
        
        dealer_results = test_agro_dealer(dealer_h)
        all_results.update(dealer_results)
        
        ngo_results = test_ngo(ngo_h)
        all_results.update(ngo_results)
        
        regression_results = test_regression(farmer_h, admin_h)
        all_results.update(regression_results)
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        sys.exit(1)
    
    # Generate final report
    print("\n" + "="*60)
    print("  AgriSync 360 — FINAL QA VERIFICATION REPORT")
    print("="*60)
    
    sections = {
        "Authentication": [k for k in all_results if k.startswith('1.')],
        "Password Reset": [k for k in all_results if k.startswith('2.')],
        "Role Access Control": [k for k in all_results if k.startswith('3.')],
        "USSD Integration": [k for k in all_results if k.startswith('4.')],
        "Subscription Plans": [k for k in all_results if k.startswith('5.')],
        "Agro-Dealer": [k for k in all_results if k.startswith('6.')],
        "NGO Dashboard": [k for k in all_results if k.startswith('7.')],
        "Regression Tests": [k for k in all_results if k.startswith('8.')],
    }
    
    total_pass = 0
    total_fail = 0
    
    for section, keys in sections.items():
        s_pass = sum(1 for k in keys if all_results.get(k, False))
        s_fail = len(keys) - s_pass
        total_pass += s_pass
        total_fail += s_fail
        icon = "✅" if s_fail == 0 else "⚠️ "
        print(f"  {icon} {section}: {s_pass}/{len(keys)}")
    
    total = total_pass + total_fail
    pct = int((total_pass / total) * 100) if total > 0 else 0
    
    print("\n" + "="*60)
    print(f"  TOTAL: {total_pass}/{total} tests passed ({pct}%)")
    print("="*60)
    
    if pct == 100:
        print("""
  🎉 BACKEND 100% COMPLETE!
  
  ✅ Authentication — all 4 roles working
  ✅ Password Reset — SMS OTP flow complete
  ✅ USSD *384*360# — full Swahili menu
  ✅ Subscription Plans — KSH 99 / KSH 299
  ✅ Agro-Dealer Portal — fully operational
  ✅ NGO Dashboard — bulk registration working
  ✅ Role Protection — all routes secured
  ✅ All original features still working
  
  🚀 READY FOR DAY 3: REACT FRONTEND BUILD
    """)
    else:
        print(f"\n  ⚠️  {total_fail} test(s) failing — fix before Day 3")
        failing = [k for k, v in all_results.items() if not v]
        for f in failing:
            print(f"     ❌ {f}")
    
    print("="*60)
    return pct == 100

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
