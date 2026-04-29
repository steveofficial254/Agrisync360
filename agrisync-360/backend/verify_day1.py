#!/usr/bin/env python3
"""
AgriSync 360 — Day 1 Verification Script
Run: python verify_day1.py
"""
import requests
import redis
import json
import sys
import os
from datetime import datetime

BASE_URL = "http://localhost:5000"
RESULTS = []

def test(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    RESULTS.append((name, passed, detail))
    print(f"{status} | {name}")
    if not passed and detail:
        print(f"       → {detail}")

def run_all_tests():
    print("\n" + "="*50)
    print("  AgriSync 360 — Day 1 Verification")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50 + "\n")

    # Test 1: Health endpoint
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        data = r.json()
        test("Health endpoint responds", r.status_code == 200)
        test("Health returns success:true", data.get('success') == True)
        test("Database connection", 
             data.get('data', {}).get('checks', {}).get('database') == 'ok',
             "Database not connected")
        test("Redis connection",
             data.get('data', {}).get('checks', {}).get('redis') == 'ok',
             "Redis not connected")
    except Exception as e:
        test("Health endpoint responds", False, str(e))

    # Test 2: Register endpoint
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register",
            json={"phone": "0712345678", 
                  "password": "Test1234!", 
                  "role": "farmer"},
            timeout=10)
        data = r.json()
        test("Register endpoint responds", r.status_code in [200, 201, 409])
        test("Register returns success or duplicate", 
             data.get('success') == True or r.status_code == 409)
        if data.get('success'):
            test("Register returns user_id",
                 'user_id' in data.get('data', {}))
            otp = data.get('data', {}).get('otp')
            test("Register returns OTP in dev mode", 
                 otp is not None,
                 "OTP not returned — cannot test verify flow")
            return otp  # return for next test
    except Exception as e:
        test("Register endpoint responds", False, str(e))
    return None

    # Test 3: Invalid phone rejected
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register",
            json={"phone": "12345", "password": "Test1234!"},
            timeout=5)
        test("Invalid phone returns 400", r.status_code == 400)
    except Exception as e:
        test("Invalid phone validation", False, str(e))

    # Test 4: Protected route
    try:
        r = requests.get(f"{BASE_URL}/api/farmers/profile", timeout=5)
        test("Protected route returns 401 without token", 
             r.status_code == 401)
    except Exception as e:
        test("Protected route auth check", False, str(e))

    # Test 5: Weather endpoint
    try:
        r = requests.get(
            f"{BASE_URL}/api/weather/forecast",
            params={"lat": -1.2921, "lon": 36.8219},
            timeout=15)
        data = r.json()
        test("Weather endpoint responds", r.status_code == 200)
        test("Weather returns forecast array", 
             isinstance(data.get('data', {}).get('forecast'), list))
        test("Weather has 7 days", 
             len(data.get('data', {}).get('forecast', [])) == 7,
             f"Got {len(data.get('data',{}).get('forecast',[]))} days")
        test("Weather has disease_risk field",
             'disease_risk' in data.get('data',{}).get('forecast',[{}])[0])
    except Exception as e:
        test("Weather endpoint", False, str(e))

    # Test 6: Redis directly
    try:
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        r.set('agrisync_test', 'ok', ex=10)
        val = r.get('agrisync_test')
        test("Redis set/get works", val == b'ok')
    except Exception as e:
        test("Redis connection", False, str(e))

    # Test 7: Database tables exist
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://agrisync_user:agrisync_pass@localhost/agrisync_db"
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema='public'
        """)
        tables = [row[0] for row in cur.fetchall()]
        required = ['users', 'farmer_profile', 'farm', 'crop', 
                    'payment', 'sms_logs', 'alert']
        for table in required:
            test(f"Table '{table}' exists", 
                 any(table in t for t in tables),
                 f"Table missing. Found: {tables}")
        conn.close()
    except Exception as e:
        test("Database tables", False, str(e))

    # SUMMARY
    print("\n" + "="*50)
    passed = sum(1 for _, p, _ in RESULTS if p)
    total = len(RESULTS)
    pct = int((passed/total)*100) if total > 0 else 0
    print(f"  Results: {passed}/{total} tests passed ({pct}%)")
    
    if pct == 100:
        print("  🎉 Day 1 COMPLETE — Ready for Day 2!")
    elif pct >= 75:
        print("  ⚠️  Almost there — fix failing tests above")
    else:
        print("  ❌ Significant issues — review errors above")
    print("="*50 + "\n")
    
    return pct == 100

if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
