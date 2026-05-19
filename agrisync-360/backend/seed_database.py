#!/usr/bin/env python3
"""
AgriSync 360 Database Seeding Script
Seeds the database with test data for development and testing.
"""

import os
import sys
import secrets
import string
from datetime import date, timedelta, datetime
from werkzeug.security import generate_password_hash
import uuid

def generate_secure_password(length=12):
    """Generate a secure random password"""
    # Include uppercase, lowercase, digits, and special characters
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.farmer import Farmer
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.payment import Payment
from app.models.market import Market
from app.models.advisory import Advisory
from app.models.alert import Alert
from app.models.sms import SMS

def seed_admin_user():
    """Create admin user with secure password"""
    try:
        # Check if admin user already exists
        admin = User.query.filter_by(email="admin@agrisync360.com").first()
        if admin:
            print("✅ Admin user already exists")
            return admin, None
        
        # Generate secure password
        admin_password = generate_secure_password()
        
        # Create admin user
        admin = User(
            email="admin@agrisync360.com",
            phone="+254700000000",
            password_hash=generate_password_hash(admin_password),
            role="admin",
            is_active=True,
            is_verified=True
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Admin user created successfully")
        return admin, admin_password
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        db.session.rollback()
        return None

def seed_test_farmers():
    """Create test farmers with secure passwords"""
    try:
        farmers_data = [
            {
                "email": "john.mutua@agrisync360.com",
                "phone": "+254711234567",
                "first_name": "John",
                "last_name": "Mutua",
                "national_id": "12345678",
                "county": "Nairobi",
                "sub_county": "Westlands",
                "ward": "Kawangware",
                "village": "Kawangware"
            },
            {
                "email": "mary.wanjiku@agrisync360.com",
                "phone": "+254712345678",
                "first_name": "Mary",
                "last_name": "Wanjiku",
                "national_id": "87654321",
                "county": "Nakuru",
                "sub_county": "Nakuru Town",
                "ward": "Nakuru West",
                "village": "Nakuru"
            },
            {
                "email": "joseph.kimani@agrisync360.com",
                "phone": "+254713456789",
                "first_name": "Joseph",
                "last_name": "Kimani",
                "national_id": "11223344",
                "county": "Uasin Gishu",
                "sub_county": "Eldoret Town",
                "ward": "Eldoret North",
                "village": "Eldoret"
            },
            {
                "email": "grace.ayieko@agrisync360.com",
                "phone": "+254714567890",
                "first_name": "Grace",
                "last_name": "Ayieko",
                "national_id": "55443322",
                "county": "Kisumu",
                "sub_county": "Kisumu Town",
                "ward": "Kisumu Central",
                "village": "Kisumu"
            },
            {
                "email": "samuel.korir@agrisync360.com",
                "phone": "+254715678901",
                "first_name": "Samuel",
                "last_name": "Korir",
                "national_id": "99887766",
                "county": "Kiambu",
                "sub_county": "Thika Town",
                "ward": "Thika West",
                "village": "Thika"
            }
        ]
        
        created_farmers = []
        farmer_credentials = []
        
        for farmer_data in farmers_data:
            # Check if user already exists
            user = User.query.filter_by(email=farmer_data["email"]).first()
            if user:
                print(f"✅ User {farmer_data['email']} already exists")
                farmer = Farmer.query.filter_by(user_id=user.id).first()
                if farmer:
                    created_farmers.append(farmer)
                continue
            
            # Generate secure password
            farmer_password = generate_secure_password()
            
            # Create user
            user = User(
                email=farmer_data["email"],
                phone=farmer_data["phone"],
                password_hash=generate_password_hash(farmer_password),
                role="farmer",
                is_active=True,
                is_verified=True
            )
            
            # Store credentials for output
            farmer_credentials.append({
                'email': farmer_data["email"],
                'phone': farmer_data["phone"],
                'password': farmer_password,
                'name': f"{farmer_data['first_name']} {farmer_data['last_name']}"
            })
            
            db.session.add(user)
            db.session.flush()  # Get user ID
            
            # Create farmer profile
            farmer = Farmer(
                user_id=user.id,
                first_name=farmer_data["first_name"],
                last_name=farmer_data["last_name"],
                national_id=farmer_data["national_id"],
                county=farmer_data["county"],
                sub_county=farmer_data["sub_county"],
                ward=farmer_data["ward"],
                village=farmer_data["village"]
            )
            
            db.session.add(farmer)
            created_farmers.append(farmer)
        
        db.session.commit()
        print(f"✅ Created {len(created_farmers)} test farmers")
        return created_farmers, farmer_credentials
        
    except Exception as e:
        print(f"❌ Error creating test farmers: {str(e)}")
        db.session.rollback()
        return [], []

def seed_farms_and_crops(farmers):
    """Create farms and crops for test farmers"""
    try:
        farms_data = [
            {
                "farmer_index": 0,  # John Mutua
                "farms": [
                    {
                        "name": "Green Valley Farm",
                        "latitude": -1.2921,
                        "longitude": 36.8219,
                        "county": "Nairobi",
                        "size_acres": 5.0,
                        "soil_type": "loam",
                        "water_source": "irrigation",
                        "is_primary": True
                    },
                    {
                        "name": "Riverside Plot",
                        "latitude": -1.2850,
                        "longitude": 36.8300,
                        "county": "Nairobi",
                        "size_acres": 2.5,
                        "soil_type": "clay",
                        "water_source": "river",
                        "is_primary": False
                    }
                ],
                "crops": [
                    {"crop_name": "maize", "planting_date": date.today() - timedelta(days=30), "area_planted_acres": 3.0, "variety": "Hybrid 614"},
                    {"crop_name": "beans", "planting_date": date.today() - timedelta(days=15), "area_planted_acres": 1.5, "variety": "Rosecoco"},
                    {"crop_name": "tomatoes", "planting_date": date.today() - timedelta(days=45), "area_planted_acres": 1.0, "variety": "Roma VF"}
                ]
            },
            {
                "farmer_index": 1,  # Mary Wanjiku
                "farms": [
                    {
                        "name": "Sunny Acres",
                        "latitude": -0.3031,
                        "longitude": 36.0800,
                        "county": "Nakuru",
                        "size_acres": 8.0,
                        "soil_type": "sandy",
                        "water_source": "rain",
                        "is_primary": True
                    }
                ],
                "crops": [
                    {"crop_name": "wheat", "planting_date": date.today() - timedelta(days=20), "area_planted_acres": 5.0, "variety": "Duma"},
                    {"crop_name": "potatoes", "planting_date": date.today() - timedelta(days=40), "area_planted_acres": 2.0, "variety": "Shangi"}
                ]
            },
            {
                "farmer_index": 2,  # Joseph Kimani
                "farms": [
                    {
                        "name": "Highland Farm",
                        "latitude": 0.5143,
                        "longitude": 35.2693,
                        "county": "Uasin Gishu",
                        "size_acres": 12.0,
                        "soil_type": "loam",
                        "water_source": "irrigation",
                        "is_primary": True
                    }
                ],
                "crops": [
                    {"crop_name": "maize", "planting_date": date.today() - timedelta(days=10), "area_planted_acres": 8.0, "variety": "DH02"},
                    {"crop_name": "beans", "planting_date": date.today() - timedelta(days=25), "area_planted_acres": 3.0, "variety": "KK8"}
                ]
            },
            {
                "farmer_index": 3,  # Grace Ayieko
                "farms": [
                    {
                        "name": "Lakeview Farm",
                        "latitude": -0.0917,
                        "longitude": 34.7678,
                        "county": "Kisumu",
                        "size_acres": 6.0,
                        "soil_type": "clay",
                        "water_source": "irrigation",
                        "is_primary": True
                    }
                ],
                "crops": [
                    {"crop_name": "cabbage", "planting_date": date.today() - timedelta(days=35), "area_planted_acres": 2.0, "variety": "Golden Acre"},
                    {"crop_name": "kale", "planting_date": date.today() - timedelta(days=20), "area_planted_acres": 1.5, "variety": "Sukuma Wiki"}
                ]
            },
            {
                "farmer_index": 4,  # Samuel Korir
                "farms": [
                    {
                        "name": "Thika Valley Farm",
                        "latitude": -1.0333,
                        "longitude": 37.0667,
                        "county": "Kiambu",
                        "size_acres": 4.0,
                        "soil_type": "silt",
                        "water_source": "borehole",
                        "is_primary": True
                    }
                ],
                "crops": [
                    {"crop_name": "tomatoes", "planting_date": date.today() - timedelta(days=25), "area_planted_acres": 2.5, "variety": "Cal J"},
                    {"crop_name": "onions", "planting_date": date.today() - timedelta(days=50), "area_planted_acres": 1.0, "variety": "Red Creole"}
                ]
            }
        ]
        
        created_farms = []
        created_crops = []
        
        for farm_data in farms_data:
            if farm_data["farmer_index"] >= len(farmers):
                continue
                
            farmer = farmers[farm_data["farmer_index"]]
            
            for farm_info in farm_data["farms"]:
                # Create farm
                farm = Farm(
                    farmer_id=farmer.id,
                    name=farm_info["name"],
                    location=Farm.build_point(farm_info["latitude"], farm_info["longitude"]),
                    county=farm_info["county"],
                    size_acres=farm_info["size_acres"],
                    soil_type=farm_info["soil_type"],
                    water_source=farm_info["water_source"],
                    is_primary=farm_info["is_primary"]
                )
                
                db.session.add(farm)
                db.session.flush()  # Get farm ID
                created_farms.append(farm)
                
                # Create crops for this farm
                for crop_info in farm_data["crops"]:
                    crop = Crop(
                        farm_id=farm.id,
                        crop_name=crop_info["crop_name"],
                        variety=crop_info["variety"],
                        planting_date=crop_info["planting_date"],
                        area_planted_acres=crop_info["area_planted_acres"],
                        growth_stage="vegetative"  # Will be auto-calculated
                    )
                    
                    db.session.add(crop)
                    created_crops.append(crop)
        
        db.session.commit()
        print(f"✅ Created {len(created_farms)} farms and {len(created_crops)} crops")
        return created_farms, created_crops
        
    except Exception as e:
        print(f"❌ Error creating farms and crops: {str(e)}")
        db.session.rollback()
        return [], []

def seed_payments(farmers):
    """Create sample payments for test farmers"""
    try:
        payments_data = [
            {"farmer_index": 0, "plan": "pro_monthly", "amount_ksh": 299, "status": "completed", "days_ago": 30},
            {"farmer_index": 1, "plan": "basic_monthly", "amount_ksh": 99, "status": "completed", "days_ago": 15},
            {"farmer_index": 2, "plan": "pro_annual", "amount_ksh": 2499, "status": "completed", "days_ago": 60},
            {"farmer_index": 3, "plan": "basic_monthly", "amount_ksh": 99, "status": "completed", "days_ago": 45},
            {"farmer_index": 4, "plan": "pro_monthly", "amount_ksh": 299, "status": "pending", "days_ago": 5}
        ]
        
        created_payments = []
        
        for payment_data in payments_data:
            if payment_data["farmer_index"] >= len(farmers):
                continue
                
            farmer = farmers[payment_data["farmer_index"]]
            
            # Calculate subscription dates
            payment_date = date.today() - timedelta(days=payment_data["days_ago"])
            
            if payment_data["status"] == "completed":
                subscription_start = payment_date
                if "annual" in payment_data["plan"]:
                    subscription_end = subscription_start + timedelta(days=365)
                else:
                    subscription_end = subscription_start + timedelta(days=30)
            else:
                subscription_start = None
                subscription_end = None
            
            payment = Payment(
                farmer_id=farmer.id,
                plan=payment_data["plan"],
                amount_ksh=payment_data["amount_ksh"],
                phone_number=farmer.user.phone,
                status=payment_data["status"],
                payment_date=payment_date if payment_data["status"] == "completed" else None,
                subscription_start=subscription_start,
                subscription_end=subscription_end,
                created_at=payment_date
            )
            
            if payment_data["status"] == "completed":
                payment.mpesa_receipt_number = f"TEST{uuid.uuid4().hex[:8].upper()}"
                payment.mpesa_reference = payment.mpesa_receipt_number
            
            db.session.add(payment)
            created_payments.append(payment)
        
        db.session.commit()
        print(f"✅ Created {len(created_payments)} sample payments")
        return created_payments
        
    except Exception as e:
        print(f"❌ Error creating payments: {str(e)}")
        db.session.rollback()
        return []

def seed_market_data():
    """Seed market price data"""
    try:
        from app.utils.seed_market_data import seed as seed_market
        
        seed_market()
        print("✅ Market data seeded successfully")
        
    except Exception as e:
        print(f"❌ Error seeding market data: {str(e)}")

def seed_advisory_data():
    """Seed advisory data"""
    try:
        from app.utils.seed_advisory_data import seed as seed_advisory
        
        seed_advisory()
        print("✅ Advisory data seeded successfully")
        
    except Exception as e:
        print(f"❌ Error seeding advisory data: {str(e)}")

def seed_admin_alerts():
    """Create sample admin alerts"""
    try:
        alerts_data = [
            {
                "title": "System Maintenance Scheduled",
                "message": "System maintenance is scheduled for this weekend. Services may be temporarily unavailable.",
                "alert_type": "system",
                "priority": "medium",
                "recipients_count": 100,
                "sent_count": 95,
                "failed_count": 5
            },
            {
                "title": "New Feature Released",
                "message": "Market intelligence feature is now live for all pro subscribers!",
                "alert_type": "feature",
                "priority": "low",
                "recipients_count": 50,
                "sent_count": 50,
                "failed_count": 0
            },
            {
                "title": "Weather Warning",
                "message": "Heavy rainfall expected in Nairobi region. Take necessary precautions for your crops.",
                "alert_type": "weather",
                "priority": "high",
                "recipients_count": 25,
                "sent_count": 25,
                "failed_count": 0
            }
        ]
        
        created_alerts = []
        
        for alert_data in alerts_data:
            alert = Alert(
                title=alert_data["title"],
                message=alert_data["message"],
                alert_type=alert_data["alert_type"],
                priority=alert_data["priority"],
                recipients_count=alert_data["recipients_count"],
                sent_count=alert_data["sent_count"],
                failed_count=alert_data["failed_count"],
                created_at=datetime.utcnow()
            )
            
            db.session.add(alert)
            created_alerts.append(alert)
        
        db.session.commit()
        print(f"✅ Created {len(created_alerts)} sample alerts")
        return created_alerts
        
    except Exception as e:
        print(f"❌ Error creating alerts: {str(e)}")
        db.session.rollback()
        return []

def create_credentials_file(credentials):
    """Create a secure credentials file with proper permissions"""
    try:
        credentials_file = "SECURE_CREDENTIALS.txt"
        
        with open(credentials_file, 'w') as f:
            f.write("🔐 AgriSync 360 - Test User Credentials\n")
            f.write("=" * 50 + "\n")
            f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("\n⚠️  IMPORTANT SECURITY NOTICE:\n")
            f.write("1. Change these passwords immediately after first login\n")
            f.write("2. Store this file securely\n")
            f.write("3. Delete this file after changing passwords\n")
            f.write("4. Never commit this file to version control\n")
            f.write("\n" + "=" * 50 + "\n\n")
            
            for user_type, data in credentials.items():
                if data['password']:  # Only show if password was newly generated
                    f.write(f"👤 {user_type.upper()} USER:\n")
                    f.write(f"   Email: {data['email']}\n")
                    f.write(f"   Phone: {data['phone']}\n")
                    f.write(f"   Password: {data['password']}\n")
                    f.write(f"   Role: {data['role']}\n")
                    f.write(f"   Dashboard: {data['dashboard_url']}\n")
                    f.write("\n")
        
        # Set file permissions (read/write for owner only)
        os.chmod(credentials_file, 0o600)
        
        print(f"📄 Credentials saved to: {credentials_file}")
        print("🔒 File permissions set to read/write for owner only")
        
    except Exception as e:
        print(f"❌ Error creating credentials file: {str(e)}")

def main():
    """Main seeding function"""
    print("🌱 Starting AgriSync 360 Database Seeding")
    print("=" * 50)
    
    # Create Flask app and database context
    app = create_app('development')
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created/verified")
            
            # Seed data
            print("\n👤 Seeding Users...")
            admin, admin_password = seed_admin_user()
            
            print("\n🧑‍🌾 Seeding Farmers...")
            farmers, farmer_credentials = seed_test_farmers()
            
            print("\n🏡 Seeding Farms and Crops...")
            farms, crops = seed_farms_and_crops(farmers)
            
            print("\n💳 Seeding Payments...")
            payments = seed_payments(farmers)
            
            print("\n📊 Seeding Market Data...")
            seed_market_data()
            
            print("\n📝 Seeding Advisory Data...")
            seed_advisory_data()
            
            print("\n🚨 Seeding Admin Alerts...")
            alerts = seed_admin_alerts()
            
            print("\n" + "=" * 50)
            print("🎉 Database seeding completed successfully!")
            print("\n📊 Summary:")
            print(f"   • Admin users: 1")
            print(f"   • Test farmers: {len(farmers)}")
            print(f"   • Farms: {len(farms)}")
            print(f"   • Crops: {len(crops)}")
            print(f"   • Payments: {len(payments)}")
            print(f"   • Market prices: Seeded")
            print(f"   • Advisories: Seeded")
            print(f"   • Admin alerts: {len(alerts)}")
            
            # Prepare credentials for file
            credentials = {
                'admin': {
                    'email': 'admin@agrisync360.com',
                    'phone': '+254700000000',
                    'password': admin_password,
                    'role': 'admin',
                    'dashboard_url': '/admin'
                }
            }
            
            # Add farmer credentials
            for i, cred in enumerate(farmer_credentials, 1):
                if cred['password']:  # Only add if password was newly generated
                    credentials[f'farmer_{i}'] = {
                        'email': cred['email'],
                        'phone': cred['phone'],
                        'password': cred['password'],
                        'role': 'farmer',
                        'dashboard_url': '/dashboard',
                        'name': cred['name']
                    }
            
            # Create credentials file if new passwords were generated
            if any([admin_password] + [cred['password'] for cred in farmer_credentials]):
                create_credentials_file(credentials)
            
            print("\n🔑 Dashboard Access URLs:")
            print("   • Admin Dashboard: http://localhost:5000/admin")
            print("   • Farmer Dashboard: http://localhost:5000/dashboard")
            
            if admin_password or any(cred['password'] for cred in farmer_credentials):
                print("\n📄 Check SECURE_CREDENTIALS.txt for login details")
                print("⚠️  Remember to change passwords and delete the credentials file!")
            
            print("\n🚀 Ready for testing!")
            print("   • Run verification: python verify_day2.py")
            print("   • Start Celery: celery -A celery_worker.celery worker --loglevel=info")
            print("   • Start Flask: python run.py")
            
        except Exception as e:
            print(f"\n❌ Seeding failed: {str(e)}")
            print("Please check the error above and fix any issues.")
            sys.exit(1)

if __name__ == "__main__":
    main()
