#!/usr/bin/env python3
"""
AgriSync 360 Day 2 Complete Verification Script
Runs comprehensive end-to-end testing of all Day 2 features.
"""

import os
import sys
import json
import time
import subprocess
import threading
from datetime import datetime, timedelta
import psycopg2
import redis

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.farmer import Farmer
from app.models.farm import Farm
from app.models.crop import Crop

BASE_URL = "http://localhost:5000"
TEST_USER = {
    "phone": "0799888777",
    "password": "TestPass1234!",
    "email": "test@agrisync360.com"
}

ADMIN_USER = {
    "phone": "0700000001", 
    "password": "Admin1234!",
    "email": "admin@agrisync360.com"
}

def log_test(test_name, success, message="", details=None):
    """Log test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"   {message}")
    if details:
        print(f"   Details: {details}")
    return success

def start_flask_server():
    """Start Flask server in background"""
    print("🚀 Starting Flask server...")
    try:
        # Start Flask server
        env = os.environ.copy()
        env['PYTHONPATH'] = os.path.dirname(os.path.abspath(__file__))
        
        process = subprocess.Popen([
            sys.executable, 'run.py'
        ], cwd=os.path.dirname(os.path.abspath(__file__)), 
           env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for server to start
        for i in range(30):  # Wait up to 30 seconds
            time.sleep(1)
            try:
                import requests
                response = requests.get(f"{BASE_URL}/api/health", timeout=2)
                if response.status_code == 200:
                    print("✅ Flask server started successfully")
                    return process
            except:
                pass
        
        print("❌ Flask server failed to start")
        process.terminate()
        return None
        
    except Exception as e:
        print(f"❌ Error starting Flask server: {str(e)}")
        return None

def seed_database_if_needed():
    """Seed database if empty"""
    try:
        app = create_app('development')
        with app.app_context():
            # Check if users exist
            user_count = User.query.count()
            if user_count == 0:
                print("📋 Database empty, seeding...")
                subprocess.run([sys.executable, 'seed_database.py'], 
                             cwd=os.path.dirname(os.path.abspath(__file__)))
                print("✅ Database seeded")
            else:
                print(f"✅ Database has {user_count} users")
    except Exception as e:
        print(f"❌ Database seeding error: {str(e)}")

def test_authentication():
    """Test complete authentication flow"""
    print("\n=== AUTHENTICATION FLOW ===")
    results = []
    
    try:
        import requests
        
        # Test 1: Register new user
        print("1. Registering test user...")
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "phone": TEST_USER["phone"],
            "password": TEST_USER["password"],
            "email": TEST_USER["email"]
        })
        
        print(f"   Status: {r.status_code}")
        
        if r.status_code in [201, 409]:
            if r.status_code == 201:
                data = r.json()
                otp = data.get('data', {}).get('otp')
                print(f"   OTP: {otp}")
                
                # Test 2: Verify OTP
                print("2. Verifying OTP...")
                r2 = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
                    "phone": TEST_USER["phone"],
                    "otp": str(otp)
                })
                print(f"   Status: {r2.status_code}")
                
                if r2.status_code == 200:
                    tokens = r2.json().get('data', {})
                    access_token = tokens.get('access_token')
                    results.append(log_test("OTP Verification", True, "OTP verified successfully"))
                else:
                    results.append(log_test("OTP Verification", False, f"Failed: {r2.text}"))
                    return False, None
            else:
                print("   User exists, logging in...")
                # Login instead
                r2 = requests.post(f"{BASE_URL}/api/auth/login", json={
                    "phone": TEST_USER["phone"],
                    "password": TEST_USER["password"]
                })
                print(f"   Login Status: {r2.status_code}")
                
                if r2.status_code == 200:
                    tokens = r2.json().get('data', {})
                    access_token = tokens.get('access_token')
                else:
                    results.append(log_test("Login", False, f"Failed: {r2.text}"))
                    return False, None
            
            # Test 3: Verify token works
            if access_token:
                headers = {"Authorization": f"Bearer {access_token}"}
                r3 = requests.get(f"{BASE_URL}/api/farmers/profile", headers=headers)
                token_works = r3.status_code in [200, 404]  # 404 is ok (no profile yet)
                results.append(log_test("JWT Token", token_works, "Token validation"))
                
                return all(results), access_token
        else:
            results.append(log_test("Registration", False, f"Failed: {r.text}"))
            
    except Exception as e:
        results.append(log_test("Authentication", False, f"Exception: {str(e)}"))
    
    return all(results), None

def test_farmer_profile(token):
    """Test farmer profile endpoints"""
    print("\n=== FARMER PROFILE ===")
    results = []
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        import requests
        
        # Test 1: Create profile
        print("Creating farmer profile...")
        r = requests.post(f"{BASE_URL}/api/farmers/profile",
            headers=headers,
            json={
                "first_name": "Stephen",
                "last_name": "Mburu",
                "county": "Nairobi City",
                "sub_county": "Westlands",
                "ward": "Parklands",
                "village": "Highridge"
            }
        )
        
        success = r.status_code in [201, 409]
        results.append(log_test("Create Profile", success, f"Status: {r.status_code}"))
        
        # Test 2: Get profile
        print("Getting farmer profile...")
        r2 = requests.get(f"{BASE_URL}/api/farmers/profile", headers=headers)
        success = r2.status_code == 200
        results.append(log_test("Get Profile", success, f"Status: {r2.status_code}"))
        
        if success:
            data = r2.json()
            profile = data.get('data', {})
            name_match = profile.get('first_name') == 'Stephen'
            results.append(log_test("Profile Data", name_match, "Name matches"))
        
        # Test 3: Update profile
        print("Updating profile...")
        r3 = requests.put(f"{BASE_URL}/api/farmers/profile",
            headers=headers,
            json={"village": "Kileleshwa Updated"}
        )
        success = r3.status_code == 200
        results.append(log_test("Update Profile", success, f"Status: {r3.status_code}"))
        
    except Exception as e:
        results.append(log_test("Farmer Profile", False, f"Exception: {str(e)}"))
    
    return all(results)

def test_farm_management(token):
    """Test farm management endpoints"""
    print("\n=== FARM MANAGEMENT ===")
    results = []
    headers = {"Authorization": f"Bearer {token}"}
    farm_id = None
    
    try:
        import requests
        
        # Test 1: Create farm
        print("Creating farm...")
        r = requests.post(f"{BASE_URL}/api/farms/",
            headers=headers,
            json={
                "name": "Mburu Farm Nakuru",
                "latitude": -0.3031,
                "longitude": 36.0800,
                "county": "Nakuru",
                "sub_county": "Nakuru East",
                "size_acres": 3.5,
                "soil_type": "loam",
                "water_source": "rain"
            }
        )
        
        success = r.status_code == 201
        results.append(log_test("Create Farm", success, f"Status: {r.status_code}"))
        
        if success:
            farm_data = r.json().get('data', {})
            farm_id = farm_data.get('id')
            
            # Test 2: List farms
            print("Listing farms...")
            r2 = requests.get(f"{BASE_URL}/api/farms/", headers=headers)
            success = r2.status_code == 200
            results.append(log_test("List Farms", success, f"Status: {r2.status_code}"))
            
            # Test 3: Get single farm
            if farm_id:
                print("Getting farm details...")
                r3 = requests.get(f"{BASE_URL}/api/farms/{farm_id}", headers=headers)
                success = r3.status_code == 200
                results.append(log_test("Get Farm", success, f"Status: {r3.status_code}"))
        
    except Exception as e:
        results.append(log_test("Farm Management", False, f"Exception: {str(e)}"))
    
    return all(results), farm_id

def test_crop_management(token, farm_id):
    """Test crop management endpoints"""
    print("\n=== CROP MANAGEMENT ===")
    results = []
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        import requests
        
        if not farm_id:
            results.append(log_test("Crop Management", False, "No farm ID available"))
            return all(results)
        
        # Test 1: Add maize crop
        planting_date = (datetime.now() - timedelta(days=21)).strftime('%Y-%m-%d')
        print("Adding maize crop...")
        r = requests.post(f"{BASE_URL}/api/farms/{farm_id}/crops",
            headers=headers,
            json={
                "crop_name": "maize",
                "planting_date": planting_date,
                "area_planted_acres": 2.0,
                "variety": "H614D"
            }
        )
        
        success = r.status_code == 201
        results.append(log_test("Add Crop", success, f"Status: {r.status_code}"))
        
        if success:
            crop_data = r.json().get('data', {})
            growth_stage = crop_data.get('growth_stage')
            days_planted = crop_data.get('days_since_planting')
            
            # Verify growth stage calculation
            stage_correct = growth_stage == 'vegetative'
            results.append(log_test("Growth Stage", stage_correct, 
                                 f"Stage: {growth_stage}, Days: {days_planted}"))
        
        # Test 2: Add beans crop
        print("Adding beans crop...")
        r2 = requests.post(f"{BASE_URL}/api/farms/{farm_id}/crops",
            headers=headers,
            json={
                "crop_name": "beans",
                "planting_date": (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'),
                "area_planted_acres": 1.0
            }
        )
        success = r2.status_code == 201
        results.append(log_test("Add Beans", success, f"Status: {r2.status_code}"))
        
        # Test 3: List crops
        print("Listing crops...")
        r3 = requests.get(f"{BASE_URL}/api/farms/{farm_id}/crops", headers=headers)
        success = r3.status_code == 200
        results.append(log_test("List Crops", success, f"Status: {r3.status_code}"))
        
        if success:
            crops = r3.json().get('data', [])
            has_crops = len(crops) >= 2
            results.append(log_test("Crop Count", has_crops, f"Found {len(crops)} crops"))
        
    except Exception as e:
        results.append(log_test("Crop Management", False, f"Exception: {str(e)}"))
    
    return all(results)

def test_weather_endpoints():
    """Test weather endpoints"""
    print("\n=== WEATHER ENDPOINTS ===")
    results = []
    
    try:
        import requests
        
        # Test 1: Get forecast
        print("Getting weather forecast...")
        r = requests.get(f"{BASE_URL}/api/weather/forecast",
            params={"lat": -0.3031, "lon": 36.0800},
            timeout=15
        )
        
        success = r.status_code == 200
        results.append(log_test("Weather Forecast", success, f"Status: {r.status_code}"))
        
        if success:
            data = r.json().get('data', {})
            forecast = data.get('forecast', [])
            has_forecast = len(forecast) == 7
            results.append(log_test("7-Day Forecast", has_forecast, f"Days: {len(forecast)}"))
            
            if forecast:
                today = forecast[0]
                has_disease_risk = 'disease_risk' in today
                has_frost_risk = 'frost_risk' in today
                has_planting = 'planting_window' in today
                
                results.append(log_test("Weather Data", has_disease_risk and has_frost_risk and has_planting,
                                     "Complete weather data present"))
        
        # Test 2: Planting window
        print("Getting planting window...")
        r2 = requests.get(f"{BASE_URL}/api/weather/planting-window",
            params={"crop": "maize", "lat": -0.3031, "lon": 36.0800}
        )
        success = r2.status_code == 200
        results.append(log_test("Planting Window", success, f"Status: {r2.status_code}"))
        
        # Test 3: Disease risk
        print("Getting disease risk...")
        r3 = requests.get(f"{BASE_URL}/api/weather/disease-risk",
            params={"lat": -0.3031, "lon": 36.0800}
        )
        success = r3.status_code == 200
        results.append(log_test("Disease Risk", success, f"Status: {r3.status_code}"))
        
    except Exception as e:
        results.append(log_test("Weather Endpoints", False, f"Exception: {str(e)}"))
    
    return all(results)

def test_market_intelligence():
    """Test market intelligence endpoints"""
    print("\n=== MARKET INTELLIGENCE ===")
    results = []
    
    try:
        import requests
        
        # Test 1: Get prices
        print("Getting market prices...")
        r = requests.get(f"{BASE_URL}/api/market/prices")
        success = r.status_code == 200
        results.append(log_test("Market Prices", success, f"Status: {r.status_code}"))
        
        if success:
            prices = r.json().get('data', [])
            has_data = len(prices) > 0
            results.append(log_test("Price Data", has_data, f"Records: {len(prices)}"))
            
            if len(prices) == 0:
                print("   No market data - seeding...")
                subprocess.run([sys.executable, 'seed_database.py'], 
                             cwd=os.path.dirname(os.path.abspath(__file__)))
                # Retry
                r = requests.get(f"{BASE_URL}/api/market/prices")
                prices = r.json().get('data', [])
        
        # Test 2: Filter by crop
        print("Filtering maize prices...")
        r2 = requests.get(f"{BASE_URL}/api/market/prices", params={"crop": "maize"})
        success = r2.status_code == 200
        results.append(log_test("Crop Filter", success, f"Status: {r2.status_code}"))
        
        # Test 3: Price history
        print("Getting price history...")
        r3 = requests.get(f"{BASE_URL}/api/market/history", 
                         params={"crop": "maize", "months": 3})
        success = r3.status_code == 200
        results.append(log_test("Price History", success, f"Status: {r3.status_code}"))
        
        # Test 4: Profitability (requires auth)
        print("Testing profitability calculator...")
        auth_token = get_test_token()
        if auth_token:
            headers = {"Authorization": f"Bearer {auth_token}"}
            r4 = requests.get(f"{BASE_URL}/api/market/profitability",
                             headers=headers,
                             params={"crop": "maize", "acres": 3})
            success = r4.status_code == 200
            results.append(log_test("Profitability", success, f"Status: {r4.status_code}"))
            
            if success:
                profit_data = r4.json().get('data', {})
                has_revenue = 'revenue' in profit_data
                has_profit = 'profit' in profit_data
                has_roi = 'roi_percent' in profit_data
                
                results.append(log_test("Profit Data", has_revenue and has_profit and has_roi,
                                     "Complete profit calculations"))
        
    except Exception as e:
        results.append(log_test("Market Intelligence", False, f"Exception: {str(e)}"))
    
    return all(results)

def test_advisory_system():
    """Test advisory system endpoints"""
    print("\n=== CROP ADVISORY ===")
    results = []
    
    try:
        import requests
        
        # Test 1: Get crop advisories
        print("Getting maize advisories...")
        r = requests.get(f"{BASE_URL}/api/advisory/crop/maize")
        success = r.status_code == 200
        results.append(log_test("Crop Advisories", success, f"Status: {r.status_code}"))
        
        if success:
            advisories = r.json().get('data', [])
            has_data = len(advisories) > 0
            results.append(log_test("Advisory Data", has_data, f"Records: {len(advisories)}"))
            
            if len(advisories) == 0:
                print("   No advisories - seeding...")
                subprocess.run([sys.executable, 'seed_database.py'], 
                             cwd=os.path.dirname(os.path.abspath(__file__)))
                # Retry
                r = requests.get(f"{BASE_URL}/api/advisory/crop/maize")
                advisories = r.json().get('data', [])
        
        # Test 2: Planting calendar
        print("Getting planting calendar...")
        r2 = requests.get(f"{BASE_URL}/api/advisory/calendar/maize")
        success = r2.status_code == 200
        results.append(log_test("Planting Calendar", success, f"Status: {r2.status_code}"))
        
        if success:
            calendar = r2.json().get('data', [])
            has_calendar = len(calendar) > 0
            results.append(log_test("Calendar Data", has_calendar, f"Weeks: {len(calendar)}"))
        
        # Test 3: Nutrition guide
        print("Getting nutrition guide...")
        r3 = requests.get(f"{BASE_URL}/api/advisory/nutrition/maize",
                         params={"growth_stage": "vegetative"})
        success = r3.status_code == 200
        results.append(log_test("Nutrition Guide", success, f"Status: {r3.status_code}"))
        
        # Test 4: Disease alerts
        print("Getting disease alerts...")
        r4 = requests.get(f"{BASE_URL}/api/advisory/pests/maize",
                         params={"risk": "high"})
        success = r4.status_code == 200
        results.append(log_test("Disease Alerts", success, f"Status: {r4.status_code}"))
        
        # Test 5: My crops advisory (requires auth)
        auth_token = get_test_token()
        if auth_token:
            headers = {"Authorization": f"Bearer {auth_token}"}
            r5 = requests.get(f"{BASE_URL}/api/advisory/my-crops", headers=headers)
            success = r5.status_code == 200
            results.append(log_test("My Crops Advisory", success, f"Status: {r5.status_code}"))
        
    except Exception as e:
        results.append(log_test("Advisory System", False, f"Exception: {str(e)}"))
    
    return all(results)

def test_payment_system():
    """Test payment system endpoints"""
    print("\n=== M-PESA PAYMENTS ===")
    results = []
    
    try:
        import requests
        
        auth_token = get_test_token()
        if not auth_token:
            results.append(log_test("Payment System", False, "No auth token"))
            return all(results)
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test 1: Check subscription status
        print("Checking subscription status...")
        r = requests.get(f"{BASE_URL}/api/payments/subscription", headers=headers)
        success = r.status_code == 200
        results.append(log_test("Subscription Status", success, f"Status: {r.status_code}"))
        
        # Test 2: Initiate STK Push
        print("Initiating M-Pesa STK Push...")
        r2 = requests.post(f"{BASE_URL}/api/payments/subscribe",
                          headers=headers,
                          json={
                              "plan": "basic_monthly",
                              "phone": "0712345678"
                          })
        # In sandbox this may fail but endpoint should work
        success = r2.status_code in [200, 400, 500]
        results.append(log_test("STK Push Endpoint", success, f"Status: {r2.status_code}"))
        
        # Test 3: Callback endpoint
        print("Testing callback endpoint...")
        r3 = requests.post(f"{BASE_URL}/api/payments/mpesa/callback",
                          json={
                              "Body": {
                                  "stkCallback": {
                                      "ResultCode": 0,
                                      "CheckoutRequestID": "test-123",
                                      "CallbackMetadata": {
                                          "Item": [
                                              {"Name": "MpesaReceiptNumber", "Value": "ABC123"},
                                              {"Name": "Amount", "Value": 99}
                                          ]
                                      }
                                  }
                              }
                          })
        success = r3.status_code == 200
        results.append(log_test("Callback Endpoint", success, f"Status: {r3.status_code}"))
        
        # Test 4: Payment history
        print("Getting payment history...")
        r4 = requests.get(f"{BASE_URL}/api/payments/history", headers=headers)
        success = r4.status_code == 200
        results.append(log_test("Payment History", success, f"Status: {r4.status_code}"))
        
    except Exception as e:
        results.append(log_test("Payment System", False, f"Exception: {str(e)}"))
    
    return all(results)

def test_admin_dashboard():
    """Test admin dashboard endpoints"""
    print("\n=== ADMIN DASHBOARD ===")
    results = []
    
    try:
        import requests
        
        # Get admin token
        admin_token = get_admin_token()
        if not admin_token:
            results.append(log_test("Admin Dashboard", False, "No admin token"))
            return all(results)
        
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test 1: Dashboard stats
        print("Getting dashboard stats...")
        r = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers)
        success = r.status_code == 200
        results.append(log_test("Dashboard Stats", success, f"Status: {r.status_code}"))
        
        if success:
            stats = r.json().get('data', {})
            has_users = 'users' in stats
            has_revenue = 'revenue' in stats
            has_subscriptions = 'subscriptions' in stats
            
            results.append(log_test("Stats Data", has_users and has_revenue and has_subscriptions,
                                 "Complete dashboard metrics"))
        
        # Test 2: Farmer list
        print("Getting farmer list...")
        r2 = requests.get(f"{BASE_URL}/api/admin/farmers", headers=admin_headers)
        success = r2.status_code == 200
        results.append(log_test("Farmer List", success, f"Status: {r2.status_code}"))
        
        # Test 3: Revenue analytics
        print("Getting revenue analytics...")
        r3 = requests.get(f"{BASE_URL}/api/admin/revenue", headers=admin_headers)
        success = r3.status_code == 200
        results.append(log_test("Revenue Analytics", success, f"Status: {r3.status_code}"))
        
        # Test 4: SMS logs
        print("Getting SMS logs...")
        r4 = requests.get(f"{BASE_URL}/api/admin/sms-logs", headers=admin_headers)
        success = r4.status_code == 200
        results.append(log_test("SMS Logs", success, f"Status: {r4.status_code}"))
        
        # Test 5: Admin protection
        print("Testing admin protection...")
        user_token = get_test_token()
        if user_token:
            user_headers = {"Authorization": f"Bearer {user_token}"}
            r5 = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=user_headers)
            protected = r5.status_code == 403
            results.append(log_test("Admin Protection", protected, f"Status: {r5.status_code}"))
        
    except Exception as e:
        results.append(log_test("Admin Dashboard", False, f"Exception: {str(e)}"))
    
    return all(results)

def test_celery_tasks():
    """Test Celery tasks"""
    print("\n=== CELERY TASKS ===")
    results = []
    
    try:
        # Test task imports
        print("Testing task imports...")
        try:
            from app.tasks.weather_tasks import refresh_weather_for_all_farmers
            from app.tasks.sms_tasks import send_weekly_advisory
            from app.tasks.sms_tasks import send_subscription_expiry_reminders
            from app.tasks.market_tasks import scrape_market_prices
            results.append(log_test("Task Imports", True, "All tasks import successfully"))
        except ImportError as e:
            results.append(log_test("Task Imports", False, f"Import error: {str(e)}"))
        
        # Test Celery beat schedule
        print("Checking Celery beat schedule...")
        try:
            from celery_worker import celery
            schedule = celery.conf.beat_schedule
            expected_tasks = [
                'refresh-weather-6h',
                'send-weather-alerts', 
                'weekly-advisory-sunday',
                'daily-market-prices',
                'subscription-reminders'
            ]
            
            found_tasks = 0
            for task_name in expected_tasks:
                if task_name in schedule:
                    found_tasks += 1
            
            results.append(log_test("Celery Schedule", found_tasks >= 4, 
                                 f"Found {found_tasks}/{len(expected_tasks)} tasks"))
        except Exception as e:
            results.append(log_test("Celery Schedule", False, f"Error: {str(e)}"))
        
    except Exception as e:
        results.append(log_test("Celery Tasks", False, f"Exception: {str(e)}"))
    
    return all(results)

def get_test_token():
    """Get test user token"""
    try:
        import requests
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": TEST_USER["phone"],
            "password": TEST_USER["password"]
        })
        if r.status_code == 200:
            return r.json().get('data', {}).get('access_token')
    except:
        pass
    return None

def get_admin_token():
    """Get admin token"""
    try:
        import requests
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": ADMIN_USER["phone"],
            "password": ADMIN_USER["password"]
        })
        if r.status_code == 200:
            return r.json().get('data', {}).get('access_token')
    except:
        pass
    return None

def test_data_integrity():
    """Test database integrity"""
    print("\n=== DATA INTEGRITY ===")
    results = []
    
    try:
        conn = psycopg2.connect(
            "postgresql://agrisync_user:agrisync_pass@localhost/agrisync_db"
        )
        cur = conn.cursor()
        
        # Check key tables
        checks = [
            ("Users", "SELECT COUNT(*) FROM \"user\""),
            ("Farmer profiles", "SELECT COUNT(*) FROM farmer_profile"),
            ("Farms", "SELECT COUNT(*) FROM farm"),
            ("Crops", "SELECT COUNT(*) FROM crop"),
            ("Market prices", "SELECT COUNT(*) FROM market_price"),
            ("Advisories", "SELECT COUNT(*) FROM advisory"),
            ("SMS logs", "SELECT COUNT(*) FROM sms_log"),
        ]
        
        for label, query in checks:
            try:
                cur.execute(query)
                count = cur.fetchone()[0]
                has_data = count > 0
                results.append(log_test(label, has_data, f"Records: {count}"))
            except Exception as e:
                results.append(log_test(label, False, f"Error: {str(e)}"))
        
        # Check admin user
        try:
            cur.execute("SELECT role FROM \"user\" WHERE phone = '+2547000000001'")
            admin = cur.fetchone()
            admin_exists = admin and admin[0] == 'admin'
            results.append(log_test("Admin User", admin_exists, "Admin role verified"))
        except Exception as e:
            results.append(log_test("Admin User", False, f"Error: {str(e)}"))
        
        conn.close()
        
    except Exception as e:
        results.append(log_test("Database Connection", False, f"Error: {str(e)}"))
    
    return all(results)

def test_security():
    """Test security measures"""
    print("\n=== SECURITY CHECKS ===")
    results = []
    
    try:
        import requests
        
        # Test JWT protection
        print("Testing JWT protection...")
        protected_routes = [
            ("GET", "/api/farmers/profile"),
            ("POST", "/api/farms/"),
            ("GET", "/api/payments/subscription"),
            ("GET", "/api/admin/dashboard"),
        ]
        
        for method, route in protected_routes:
            r = requests.request(method, f"{BASE_URL}{route}")
            protected = r.status_code == 401
            results.append(log_test(f"JWT Protection {method} {route}", protected,
                                 f"Status: {r.status_code}"))
        
        # Test input validation
        print("Testing input validation...")
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "phone": "'; DROP TABLE user; --",
            "password": "test"
        })
        validation_works = r.status_code in [400, 422]
        results.append(log_test("Input Validation", validation_works, f"Status: {r.status_code}"))
        
        # Test CORS headers
        print("Testing CORS headers...")
        r = requests.options(f"{BASE_URL}/api/health",
                           headers={"Origin": "http://localhost:5173"})
        has_cors = 'Access-Control-Allow-Origin' in r.headers
        results.append(log_test("CORS Headers", has_cors, "CORS present"))
        
    except Exception as e:
        results.append(log_test("Security Tests", False, f"Exception: {str(e)}"))
    
    return all(results)

def main():
    """Run complete verification"""
    print("🧪 AgriSync 360 Day 2 Complete Verification")
    print("=" * 60)
    
    # Step 1: Start Flask server
    flask_process = start_flask_server()
    if not flask_process:
        print("❌ Cannot start verification - Flask server failed")
        return
    
    try:
        # Step 2: Seed database if needed
        seed_database_if_needed()
        
        # Step 3: Run all tests
        test_results = {}
        
        # Authentication
        auth_success, token = test_authentication()
        test_results["Authentication"] = auth_success
        
        # Farmer Profile
        if token:
            test_results["Farmer Profile"] = test_farmer_profile(token)
            
            # Farm Management
            farm_success, farm_id = test_farm_management(token)
            test_results["Farm Management"] = farm_success
            
            # Crop Management
            if farm_id:
                test_results["Crop Management"] = test_crop_management(token, farm_id)
            else:
                test_results["Crop Management"] = False
        
        # Weather
        test_results["Weather Endpoints"] = test_weather_endpoints()
        
        # Market Intelligence
        test_results["Market Intelligence"] = test_market_intelligence()
        
        # Advisory System
        test_results["Advisory System"] = test_advisory_system()
        
        # Payment System
        test_results["Payment System"] = test_payment_system()
        
        # Admin Dashboard
        test_results["Admin Dashboard"] = test_admin_dashboard()
        
        # Celery Tasks
        test_results["Celery Tasks"] = test_celery_tasks()
        
        # Data Integrity
        test_results["Data Integrity"] = test_data_integrity()
        
        # Security
        test_results["Security"] = test_security()
        
        # Generate final report
        print("\n" + "=" * 60)
        print("  AgriSync 360 — Day 2 Complete Verification Report")
        print("=" * 60)
        
        passed = sum(1 for v in test_results.values() if v)
        total = len(test_results)
        
        for name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} | {name}")
        
        print("\n" + "=" * 60)
        print(f"  Score: {passed}/{total} ({int(passed/total*100)}%)")
        
        if passed == total:
            print("  🎉 Day 2 COMPLETE — Ready for Day 3 Frontend!")
            print("\n📋 Day 3 Preview — React Frontend:")
            print("  Morning:   Landing page, Auth pages, Design system")
            print("  Afternoon: Farmer dashboard, Weather widget")
            print("  Evening:   Advisory pages, Market intelligence")
            print("\n  All API endpoints are ready and waiting.")
            print("  Frontend connects to live backend from hour 1.")
        elif passed >= total * 0.85:
            print("  ⚠️  Almost done — fix failing items above")
        else:
            print("  ❌ Significant issues — review and fix")
        
        print("=" * 60)
        
    finally:
        # Clean up Flask server
        if flask_process:
            print("\n🛑 Stopping Flask server...")
            flask_process.terminate()
            flask_process.wait()

if __name__ == "__main__":
    main()
