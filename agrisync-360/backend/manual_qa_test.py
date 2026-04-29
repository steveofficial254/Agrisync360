#!/usr/bin/env python3
"""
Manual QA Test - Run individual tests
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"Health: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('data', {}).get('status')}")
            return True
        return False
    except Exception as e:
        print(f"Health failed: {e}")
        return False

def test_register():
    """Test registration"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "phone": "0711111111",
            "password": "TestPass1!",
            "role": "farmer"
        })
        print(f"Register: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            otp = data.get('data', {}).get('otp')
            print(f"OTP: {otp}")
            return True, otp
        elif response.status_code == 409:
            print("User already exists")
            return True, None
        return False, None
    except Exception as e:
        print(f"Register failed: {e}")
        return False, None

def test_login():
    """Test login"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0711111111",
            "password": "TestPass1!"
        })
        print(f"Login: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get('data', {}).get('access_token')
            print(f"Token received: {bool(token)}")
            return True, token
        return False, None
    except Exception as e:
        print(f"Login failed: {e}")
        return False, None

def test_ussd():
    """Test USSD"""
    try:
        response = requests.get(f"{BASE_URL}/api/ussd/test?text=")
        print(f"USSD: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            resp = data.get('response', '')
            print(f"Response: {resp[:50]}...")
            return True
        return False
    except Exception as e:
        print(f"USSD failed: {e}")
        return False

def test_plans():
    """Test plans"""
    try:
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        print(f"Plans: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            plans = data.get('data', [])
            print(f"Plans count: {len(plans)}")
            return True
        return False
    except Exception as e:
        print(f"Plans failed: {e}")
        return False

def test_password_reset():
    """Test password reset"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "phone": "0711111111"
        })
        print(f"Forgot password: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            otp = data.get('data', {}).get('otp')
            print(f"Reset OTP: {otp}")
            return True
        return False
    except Exception as e:
        print(f"Password reset failed: {e}")
        return False

def main():
    print("=== Manual QA Test ===")
    
    # Test health
    health_ok = test_health()
    print()
    
    if not health_ok:
        print("❌ Server not responding")
        return
    
    # Test registration
    reg_ok, otp = test_register()
    print()
    
    # Test login
    login_ok, token = test_login()
    print()
    
    # Test USSD
    ussd_ok = test_ussd()
    print()
    
    # Test plans
    plans_ok = test_plans()
    print()
    
    # Test password reset
    reset_ok = test_password_reset()
    print()
    
    # Summary
    tests = [health_ok, reg_ok, login_ok, ussd_ok, plans_ok, reset_ok]
    passed = sum(tests)
    total = len(tests)
    
    print(f"=== SUMMARY ===")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All basic tests passed!")
    else:
        print("❌ Some tests failed")

if __name__ == "__main__":
    main()
