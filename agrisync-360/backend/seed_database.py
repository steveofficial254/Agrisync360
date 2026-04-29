#!/usr/bin/env python3
"""
AgriSync 360 Database Seeding Script
Seeds the database with test data for development and testing.
"""

import os
import sys
from datetime import date, timedelta, datetime
from werkzeug.security import generate_password_hash
import uuid

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
    """Create admin user"""
    try:
        # Check if admin user already exists
        admin = User.query.filter_by(email="admin@agrisync360.com").first()
        if admin:
            print("✅ Admin user already exists")
            return admin
        
        # Create admin user
        admin = User(
            email="admin@agrisync360.com",
            phone="+254700000000",
            password_hash=generate_password_hash("Admin123!"),
            role="admin",
            is_active=True,
            is_verified=True
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Admin user created successfully")
        return admin
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        db.session.rollback()
        return None

def seed_test_farmers():
    """Create test farmers with complete profiles"""
    try:
        farmers_data = [
            {
                "email": "john.mutua@agrisync360.com",
                "phone": "+254711234567",
                "password": "Farmer123!",
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
                "password": "Farmer123!",
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
                "password": "Farmer123!",
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
                "password": "Farmer123!",
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
                "password": "Farmer123!",
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
        
        for farmer_data in farmers_data:
            # Check if user already exists
            user = User.query.filter_by(email=farmer_data["email"]).first()
            if user:
                print(f"✅ User {farmer_data['email']} already exists")
                farmer = Farmer.query.filter_by(user_id=user.id).first()
                if farmer:
                    created_farmers.append(farmer)
                continue
            
            # Create user
            user = User(
                email=farmer_data["email"],
                phone=farmer_data["phone"],
                password_hash=generate_password_hash(farmer_data["password"]),
                role="farmer",
                is_active=True,
                is_verified=True
            )
            
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
        return created_farmers
        
    except Exception as e:
        print(f"❌ Error creating test farmers: {str(e)}")
        db.session.rollback()
        return []

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
            admin = seed_admin_user()
            
            print("\n🧑‍🌾 Seeding Farmers...")
            farmers = seed_test_farmers()
            
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
            
            print("\n🔑 Test User Credentials:")
            print("   Admin: admin@agrisync360.com / Admin123!")
            print("   Farmer 1: john.mutua@agrisync360.com / Farmer123!")
            print("   Farmer 2: mary.wanjiku@agrisync360.com / Farmer123!")
            print("   Farmer 3: joseph.kimani@agrisync360.com / Farmer123!")
            
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
