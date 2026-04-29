#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        return False
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_register():
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "phone": "0711111111",
            "password": "TestPass1!",
            "role": "farmer"
        })
        print(f"Register: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        return response.status_code in [200, 201, 409]
    except Exception as e:
        print(f"Register failed: {e}")
        return False

def test_ussd():
    try:
        response = requests.get(f"{BASE_URL}/api/ussd/test?text=")
        print(f"USSD: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data.get('response', '')[:100]}")
            return True
        return False
    except Exception as e:
        print(f"USSD failed: {e}")
        return False

if __name__ == "__main__":
    print("=== AgriSync 360 Simple QA Test ===")
    
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
