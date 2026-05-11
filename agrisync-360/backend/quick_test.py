#!/usr/bin/env python3
import requests
import sys

BASE = "http://localhost:5000"

def test_health():
    try:
        r = requests.get(f"{BASE}/api/health", timeout=5)
        print(f"Health check: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Status: {data.get('data', {}).get('status')}")
            return True
        return False
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_register():
    try:
        r = requests.post(f"{BASE}/api/auth/register", json={
            "phone": "0711111111",
            "password": "TestPass1!",
            "role": "farmer"
        })
        print(f"Register: {r.status_code}")
        if r.status_code in [200, 201]:
            otp = r.json().get('data', {}).get('otp')
            print(f"OTP: {otp}")
            return True
        elif r.status_code == 409:
            print("User already exists")
            return True
        return False
    except Exception as e:
        print(f"Register failed: {e}")
        return False

def test_ussd():
    try:
        r = requests.get(f"{BASE}/api/ussd/test?text=")
        print(f"USSD: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            resp = data.get('response', '')
            print(f"Response: {resp[:50]}...")
            return True
        return False
    except Exception as e:
        print(f"USSD failed: {e}")
        return False

if __name__ == "__main__":
    print("=== AgriSync 360 Quick Test ===")
    
    health_ok = test_health()
    print()
    
    if health_ok:
        register_ok = test_register()
        print()
        ussd_ok = test_ussd()
        print()
        
        if register_ok and ussd_ok:
            print("✅ Basic tests passed!")
        else:
            print("❌ Some tests failed")
    else:
        print("❌ Server not responding")
        print("   Start with: python run.py")
