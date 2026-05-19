#!/usr/bin/env python3

import requests
import sys

def test_open_meteo():
    """Test Open-Meteo API directly"""
    print("Testing Open-Meteo API...")
    
    # Test 1: Basic API call
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": -1.2921,
        "longitude": 36.8219,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relativehumidity_2m_max,weathercode",
        "timezone": "auto",
        "forecast_days": 7,
    }
    
    try:
        print(f"Request URL: {url}")
        print(f"Params: {params}")
        
        response = requests.get(url, params=params, timeout=20)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS - Data received:")
            print(f"Daily data keys: {list(data.get('daily', {}).keys())}")
            print(f"Temperature max: {data.get('daily', {}).get('temperature_2m_max', [])}")
            return True
        else:
            print(f"❌ FAILED - Status: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return False

def test_alternative_format():
    """Test alternative API format"""
    print("\nTesting alternative format...")
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": -1.2921,
        "longitude": 36.8219,
        "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
        "timezone": "auto",
        "forecast_days": 7,
    }
    
    try:
        response = requests.get(url, params=params, timeout=20)
        print(f"Alternative format - Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Alternative format works!")
            return True
        else:
            print(f"❌ Alternative format failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Alternative exception: {e}")
        return False

if __name__ == "__main__":
    print("🌤️  Open-Meteo API Test")
    print("=" * 50)
    
    success1 = test_open_meteo()
    success2 = test_alternative_format()
    
    if success1 or success2:
        print("\n✅ At least one format works!")
        sys.exit(0)
    else:
        print("\n❌ All formats failed!")
        sys.exit(1)
