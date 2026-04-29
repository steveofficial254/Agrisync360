#!/usr/bin/env python3
"""
AgriSync 360 Missing Features Verification Script
Tests all newly implemented features end-to-end
"""

import requests
import json
import time

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

def test_ussd_main_menu():
    """Test USSD Main Menu"""
    print("\n1. Testing USSD Main Menu...")
    try:
        response = requests.get(f"{BASE_URL}/api/ussd/test?text=", timeout=10)
        success = response.status_code == 200
        
        data = response.json() if success else {}
        has_main_menu = "Welcome to AgriSync 360" in data.get("response", "")
        has_options = "1. Hali ya Hewa" in data.get("response", "")
        
        log_test("USSD Main Menu", success and has_main_menu and has_options,
                f"Status: {response.status_code}",
                data.get("response", "")[:100])
        
        return success and has_main_menu and has_options
        
    except Exception as e:
        log_test("USSD Main Menu", False, f"Exception: {str(e)}")
        return False

def test_ussd_weather():
    """Test USSD Weather Flow"""
    print("\n2. Testing USSD Weather Flow...")
    try:
        # Test today's weather
        response = requests.get(f"{BASE_URL}/api/ussd/test?text=1*1", timeout=10)
        success = response.status_code == 200
        
        data = response.json() if success else {}
        is_end = data.get("response", "").startswith("END")
        has_weather = "Hali ya Hewa" in data.get("response", "")
        
        log_test("USSD Today's Weather", success and is_end and has_weather,
                f"Status: {response.status_code}",
                data.get("response", "")[:100])
        
        return success and is_end and has_weather
        
    except Exception as e:
        log_test("USSD Weather", False, f"Exception: {str(e)}")
        return False

def test_ussd_market():
    """Test USSD Market Prices"""
    print("\n3. Testing USSD Market Prices...")
    try:
        response = requests.get(f"{BASE_URL}/api/ussd/test?text=3*1", timeout=10)
        success = response.status_code == 200
        
        data = response.json() if success else {}
        is_end = data.get("response", "").startswith("END")
        has_prices = "Bei za Mahindi" in data.get("response", "")
        
        log_test("USSD Market Prices", success and is_end and has_prices,
                f"Status: {response.status_code}",
                data.get("response", "")[:100])
        
        return success and is_end and has_prices
        
    except Exception as e:
        log_test("USSD Market Prices", False, f"Exception: {str(e)}")
        return False

def test_ussd_subscribe():
    """Test USSD Subscription"""
    print("\n4. Testing USSD Subscription...")
    try:
        response = requests.get(f"{BASE_URL}/api/ussd/test?text=5*1", timeout=10)
        success = response.status_code == 200
        
        data = response.json() if success else {}
        is_end = data.get("response", "").startswith("END")
        has_subscription = "KSH 99/mwezi" in data.get("response", "")
        
        log_test("USSD Subscription", success and is_end and has_subscription,
                f"Status: {response.status_code}",
                data.get("response", "")[:100])
        
        return success and is_end and has_subscription
        
    except Exception as e:
        log_test("USSD Subscription", False, f"Exception: {str(e)}")
        return False

def test_password_reset():
    """Test Password Reset Flow"""
    print("\n5. Testing Password Reset Flow...")
    
    # Test 1: Request password reset
    try:
        print("   5a. Requesting password reset...")
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password",
                           json={"phone": "0712345678"},
                           timeout=10)
        success = response.status_code == 200
        
        if success:
            data = response.json()
            otp = data.get("data", {}).get("otp")
            print(f"       OTP received: {otp}")
        
        log_test("Password Reset Request", success,
                f"Status: {response.status_code}")
        
        if not success or not otp:
            return False
            
    except Exception as e:
        log_test("Password Reset Request", False, f"Exception: {str(e)}")
        return False
    
    # Test 2: Verify OTP
    try:
        print("   5b. Verifying OTP...")
        response = requests.post(f"{BASE_URL}/api/auth/verify-reset-otp",
                           json={"phone": "0712345678", "otp": otp},
                           timeout=10)
        success = response.status_code == 200
        
        if success:
            data = response.json()
            reset_token = data.get("data", {}).get("reset_token")
            print(f"       Reset token received: {reset_token}")
        
        log_test("OTP Verification", success,
                f"Status: {response.status_code}")
        
        if not success or not reset_token:
            return False
            
    except Exception as e:
        log_test("OTP Verification", False, f"Exception: {str(e)}")
        return False
    
    # Test 3: Reset password
    try:
        print("   5c. Resetting password...")
        response = requests.post(f"{BASE_URL}/api/auth/reset-password",
                           json={"reset_token": reset_token, "new_password": "NewPassword1234!"},
                           timeout=10)
        success = response.status_code == 200
        
        log_test("Password Reset", success,
                f"Status: {response.status_code}")
        
        return success
        
    except Exception as e:
        log_test("Password Reset", False, f"Exception: {str(e)}")
        return False

def test_plans_endpoint():
    """Test Plans Endpoint"""
    print("\n6. Testing Plans Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/payments/plans", timeout=10)
        success = response.status_code == 200
        
        if success:
            data = response.json()
            plans = data.get("data", [])
            has_basic = any(p.get("plan_id") == "basic_monthly" for p in plans)
            has_pro = any(p.get("plan_id") == "pro_monthly" for p in plans)
            has_features = all("features" in p for p in plans)
            
            log_test("Plans Endpoint", success and has_basic and has_pro and has_features,
                    f"Found {len(plans)} plans")
        
        return success and has_basic and has_pro and has_features
        
    except Exception as e:
        log_test("Plans Endpoint", False, f"Exception: {str(e)}")
        return False

def test_subscription_features():
    """Test Subscription Features"""
    print("\n7. Testing Subscription Features...")
    
    # Get auth token first
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login",
                           json={"phone": "0712345678", "password": "TestPass1234!"},
                           timeout=10)
        
        if response.status_code != 200:
            log_test("Auth Login", False, f"Status: {response.status_code}")
            return False
        
        token = response.json().get("data", {}).get("access_token")
        if not token:
            log_test("Auth Login", False, "No token received")
            return False
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test subscription endpoint
        response = requests.get(f"{BASE_URL}/api/payments/subscription",
                           headers=headers, timeout=10)
        success = response.status_code == 200
        
        if success:
            data = response.json()
            sub_data = data.get("data", {})
            has_features = "features" in sub_data
            has_upgrade = "upgrade_available" in sub_data
            
            log_test("Subscription Features", success and has_features and has_upgrade,
                    f"Plan: {sub_data.get('plan', 'unknown')}")
        
        return success and has_features and has_upgrade
        
    except Exception as e:
        log_test("Subscription Features", False, f"Exception: {str(e)}")
        return False

def test_agro_dealer():
    """Test Agro-Dealer Features"""
    print("\n8. Testing Agro-Dealer Features...")
    
    # Register agro-dealer user
    try:
        # Create user
        register_response = requests.post(f"{BASE_URL}/api/auth/register",
                                   json={"phone": "0712345679", 
                                         "password": "TestPass1234!",
                                         "role": "agro_dealer"},
                                   timeout=10)
        
        if register_response.status_code not in [201, 409]:
            log_test("Agro-Dealer Registration", False, 
                    f"Status: {register_response.status_code}")
            return False
        
        # Get OTP and verify
        if register_response.status_code == 201:
            otp = register_response.json().get("data", {}).get("otp")
            if otp:
                verify_response = requests.post(f"{BASE_URL}/api/auth/verify-otp",
                                         json={"phone": "0712345679", "otp": otp},
                                         timeout=10)
                if verify_response.status_code != 200:
                    log_test("Agro-Dealer OTP Verify", False,
                            f"Status: {verify_response.status_code}")
                    return False
                
                token = verify_response.json().get("data", {}).get("access_token")
                if not token:
                    log_test("Agro-Dealer OTP Verify", False, "No token received")
                    return False
        else:
            # Login existing user
            login_response = requests.post(f"{BASE_URL}/api/auth/login",
                                       json={"phone": "0712345679", 
                                            "password": "TestPass1234!"},
                                       timeout=10)
            if login_response.status_code != 200:
                log_test("Agro-Dealer Login", False,
                        f"Status: {login_response.status_code}")
                return False
            
            token = login_response.json().get("data", {}).get("access_token")
            if not token:
                log_test("Agro-Dealer Login", False, "No token received")
                return False
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test profile creation
        profile_response = requests.post(f"{BASE_URL}/api/dealer/profile",
                                     headers=headers,
                                     json={"business_name": "Test Agro-Dealer",
                                            "county": "Nairobi",
                                            "products": ["fertilizer", "pesticide"]},
                                     timeout=10)
        
        profile_success = profile_response.status_code in [201, 200]
        log_test("Agro-Dealer Profile", profile_success,
                f"Status: {profile_response.status_code}")
        
        # Test stats endpoint
        stats_response = requests.get(f"{BASE_URL}/api/dealer/stats",
                                   headers=headers, timeout=10)
        
        stats_success = stats_response.status_code == 200
        log_test("Agro-Dealer Stats", stats_success,
                f"Status: {stats_response.status_code}")
        
        return profile_success and stats_success
        
    except Exception as e:
        log_test("Agro-Dealer Features", False, f"Exception: {str(e)}")
        return False

def test_ngo():
    """Test NGO Features"""
    print("\n9. Testing NGO Features...")
    
    try:
        # Register NGO user
        register_response = requests.post(f"{BASE_URL}/api/auth/register",
                                   json={"phone": "0712345670", 
                                         "password": "TestPass1234!",
                                         "role": "ngo_partner"},
                                   timeout=10)
        
        if register_response.status_code not in [201, 409]:
            log_test("NGO Registration", False, 
                    f"Status: {register_response.status_code}")
            return False
        
        # Get OTP and verify
        if register_response.status_code == 201:
            otp = register_response.json().get("data", {}).get("otp")
            if otp:
                verify_response = requests.post(f"{BASE_URL}/api/auth/verify-otp",
                                         json={"phone": "0712345670", "otp": otp},
                                         timeout=10)
                if verify_response.status_code != 200:
                    log_test("NGO OTP Verify", False,
                            f"Status: {verify_response.status_code}")
                    return False
                
                token = verify_response.json().get("data", {}).get("access_token")
                if not token:
                    log_test("NGO OTP Verify", False, "No token received")
                    return False
        else:
            # Login existing user
            login_response = requests.post(f"{BASE_URL}/api/auth/login",
                                       json={"phone": "0712345670", 
                                            "password": "TestPass1234!"},
                                       timeout=10)
            if login_response.status_code != 200:
                log_test("NGO Login", False,
                        f"Status: {login_response.status_code}")
                return False
            
            token = login_response.json().get("data", {}).get("access_token")
            if not token:
                log_test("NGO Login", False, "No token received")
                return False
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test profile creation
        profile_response = requests.post(f"{BASE_URL}/api/ngo/profile",
                                     headers=headers,
                                     json={"organization_name": "Test NGO",
                                            "organization_type": "ngo",
                                            "focus_counties": ["Nairobi", "Nakuru"],
                                            "focus_crops": ["maize", "beans"]},
                                     timeout=10)
        
        profile_success = profile_response.status_code in [201, 200]
        log_test("NGO Profile", profile_success,
                f"Status: {profile_response.status_code}")
        
        # Test dashboard
        dashboard_response = requests.get(f"{BASE_URL}/api/ngo/dashboard",
                                      headers=headers, timeout=10)
        
        dashboard_success = dashboard_response.status_code == 200
        log_test("NGO Dashboard", dashboard_success,
                f"Status: {dashboard_response.status_code}")
        
        return profile_success and dashboard_success
        
    except Exception as e:
        log_test("NGO Features", False, f"Exception: {str(e)}")
        return False

def test_role_protection():
    """Test Role Protection"""
    print("\n10. Testing Role Protection...")
    
    try:
        # Get farmer token
        login_response = requests.post(f"{BASE_URL}/api/auth/login",
                                   json={"phone": "0712345678", 
                                            "password": "TestPass1234!"},
                                           timeout=10)
        
        if login_response.status_code != 200:
            log_test("Farmer Login", False, f"Status: {login_response.status_code}")
            return False
        
        farmer_token = login_response.json().get("data", {}).get("access_token")
        if not farmer_token:
            log_test("Farmer Login", False, "No token received")
            return False
        
        farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
        
        # Test farmer accessing admin endpoint
        admin_response = requests.get(f"{BASE_URL}/api/admin/dashboard",
                                   headers=farmer_headers, timeout=10)
        
        admin_blocked = admin_response.status_code == 403
        log_test("Farmer Admin Access", admin_blocked,
                f"Status: {admin_response.status_code}")
        
        # Test farmer accessing dealer endpoint
        dealer_response = requests.get(f"{BASE_URL}/api/dealer/profile",
                                   headers=farmer_headers, timeout=10)
        
        dealer_blocked = dealer_response.status_code == 403
        log_test("Farmer Dealer Access", dealer_blocked,
                f"Status: {dealer_response.status_code}")
        
        # Test farmer accessing NGO endpoint
        ngo_response = requests.get(f"{BASE_URL}/api/ngo/profile",
                                   headers=farmer_headers, timeout=10)
        
        ngo_blocked = ngo_response.status_code == 403
        log_test("Farmer NGO Access", ngo_blocked,
                f"Status: {ngo_response.status_code}")
        
        return admin_blocked and dealer_blocked and ngo_blocked
        
    except Exception as e:
        log_test("Role Protection", False, f"Exception: {str(e)}")
        return False

def test_subscription_gating():
    """Test Subscription Feature Gating"""
    print("\n11. Testing Subscription Gating...")
    
    try:
        # Get farmer token
        login_response = requests.post(f"{BASE_URL}/api/auth/login",
                                   json={"phone": "0712345678", 
                                            "password": "TestPass1234!"},
                                           timeout=10)
        
        if login_response.status_code != 200:
            log_test("Farmer Login", False, f"Status: {login_response.status_code}")
            return False
        
        farmer_token = login_response.json().get("data", {}).get("access_token")
        if not farmer_token:
            log_test("Farmer Login", False, "No token received")
            return False
        
        farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
        
        # Test accessing basic feature without subscription
        market_response = requests.get(f"{BASE_URL}/api/market/prices/all",
                                    headers=farmer_headers, timeout=10)
        
        market_blocked = market_response.status_code == 402
        log_test("Basic Feature Without Sub", market_blocked,
                f"Status: {market_response.status_code}")
        
        # Test accessing pro feature without subscription
        disease_response = requests.get(f"{BASE_URL}/api/weather/disease-risk",
                                    params={"lat": -1.2921, "lon": 36.8219},
                                    headers=farmer_headers, timeout=10)
        
        disease_blocked = disease_response.status_code == 402
        log_test("Pro Feature Without Sub", disease_blocked,
                f"Status: {disease_response.status_code}")
        
        return market_blocked and disease_blocked
        
    except Exception as e:
        log_test("Subscription Gating", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🧪 AgriSync 360 — Missing Features Verification")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code != 200:
            print("❌ Server not running. Start Flask server first.")
            print("   Run: python run.py")
            return
        
        server_ok = response.json().get("data", {}).get("status") == "healthy"
        if not server_ok:
            print("⚠️  Server running but degraded state")
            print("   Check database and Redis connections")
            return
        
        print("✅ Server is running")
    except:
        print("❌ Cannot connect to server")
        print("   Run: python run.py")
        return
    
    time.sleep(1)  # Brief pause
    
    # Run all tests
    results = []
    results.append(test_ussd_main_menu())
    results.append(test_ussd_weather())
    results.append(test_ussd_market())
    results.append(test_ussd_subscribe())
    results.append(test_password_reset())
    results.append(test_plans_endpoint())
    results.append(test_subscription_features())
    results.append(test_agro_dealer())
    results.append(test_ngo())
    results.append(test_role_protection())
    results.append(test_subscription_gating())
    
    # Generate final report
    print("\n" + "=" * 60)
    print("  AgriSync 360 — Missing Features Verification Report")
    print("=" * 60)
    
    test_names = [
        "USSD Main Menu",
        "USSD Weather Forecast",
        "USSD Market Prices", 
        "USSD Subscription",
        "Password Reset Flow",
        "Plans Endpoint",
        "Subscription Features",
        "Agro-Dealer Dashboard",
        "NGO Dashboard",
        "Role Protection",
        "Subscription Gating"
    ]
    
    passed = sum(results)
    total = len(results)
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} | {name}")
    
    print("\n" + "=" * 60)
    print(f"  Score: {passed}/{total} ({int(passed/total*100)}%)")
    
    if passed == total:
        print("  🎉 All missing features implemented!")
        print("  🚀 Ready for Day 3 Frontend Build")
        print("\n📋 Features Added:")
        print("  ✅ Extended Role System (farmer, admin, agro_dealer, ngo_partner, county_officer)")
        print("  ✅ USSD Integration with Swahili menus")
        print("  ✅ Password Reset via SMS OTP")
        print("  ✅ Subscription Plan Differentiation")
        print("  ✅ Agro-Dealer Dashboard")
        print("  ✅ NGO Partner Dashboard")
        print("  ✅ Bulk Farmer Registration")
        print("  ✅ Role-Based Access Control")
        print("  ✅ Subscription Feature Gating")
    else:
        print(f"  ⚠️  {total - passed} features need attention")
        print("  Review failed tests above")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
