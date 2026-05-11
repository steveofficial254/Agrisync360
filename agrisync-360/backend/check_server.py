#!/usr/bin/env python3
"""
Check if Flask server is running and responsive
"""

import requests
import sys

def check_server():
    try:
        # Test main health endpoint
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Flask server is running")
            print(f"Health check response: {response.json()}")
            
            # Test farms health endpoint
            try:
                farms_response = requests.get('http://localhost:5000/api/farms/health', timeout=5)
                if farms_response.status_code == 200:
                    print("✅ Farms blueprint is working")
                    print(f"Farms health response: {farms_response.json()}")
                else:
                    print(f"❌ Farms blueprint returned: {farms_response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Farms endpoint error: {e}")
            
        else:
            print(f"❌ Flask server returned: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Flask server is not running or not accessible")
        print("Please start the Flask server with: python run.py")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    check_server()
