#!/usr/bin/env python3
"""
Market Data Seeder for AgriSync 360
Seeds realistic Kenyan market prices for testing and development.
"""

import random
from datetime import date, timedelta
from app.extensions import db
from app.models.market import Market

def seed():
    """Seed market data for the last 30 days"""
    
    # Realistic price ranges (KSH per kg)
    PRICE_RANGES = {
        'maize': (40, 65),
        'beans': (120, 180),
        'potatoes': (30, 55),
        'tomatoes': (50, 120),
        'tea': (18, 35),
        'wheat': (45, 70),
        'cabbage': (20, 45),
        'kale': (15, 30),
        'onions': (60, 100),
        'sorghum': (35, 55)
    }
    
    # Counties and market locations
    MARKET_LOCATIONS = {
        'Nairobi': ['Wakulima Market', 'City Market', 'Kenyatta Market', 'Eastleigh Market', 'Kawangware Market'],
        'Nakuru': ['Nakuru Market', 'Kabarak Market', 'Njoro Market', 'Molo Market', 'Olenguruone Market'],
        'Meru': ['Meru Market', 'Nkubu Market', 'Chuka Market', 'Maua Market', 'Timau Market'],
        'Kisumu': ['Kisumu Market', 'Ahero Market', 'Muhoroni Market', 'Sori Market', 'Nyakach Market'],
        'Mombasa': ['Kongowea Market', 'Mombasa Market', 'Likoni Market', 'Diani Market', 'Mwakirunge Market'],
        'Kiambu': ['Kiambu Market', 'Thika Market', 'Kikuyu Market', 'Limuru Market', 'Ruiru Market'],
        'Uasin Gishu': ['Eldoret Market', 'Moiben Market', 'Burnt Forest Market', 'Kapsowar Market', 'Cheptiret Market']
    }
    
    # Clear existing data
    Market.query.delete()
    db.session.commit()
    
    # Generate data for the last 30 days
    end_date = date.today()
    start_date = end_date - timedelta(days=29)
    
    records_created = 0
    
    for current_date in range(30):
        current_date_obj = start_date + timedelta(days=current_date)
        
        for county, markets in MARKET_LOCATIONS.items():
            for crop_name, (min_price, max_price) in PRICE_RANGES.items():
                for market_name in markets:
                    # Base price with daily variance (±5%)
                    base_price = random.uniform(min_price, max_price)
                    daily_variance = random.uniform(0.95, 1.05)
                    final_price = round(base_price * daily_variance, 2)
                    
                    # Determine demand level
                    if final_price > (min_price + max_price) / 2:
                        demand_level = random.choice(['high', 'very_high'])
                    else:
                        demand_level = random.choice(['low', 'medium'])
                    
                    # Create record
                    record = Market(
                        crop_name=crop_name,
                        county=county,
                        market_name=market_name,
                        price_per_kg=final_price,
                        unit='kg',
                        price_per_unit=final_price,
                        demand_level=demand_level,
                        source=f"AgriSync Market Intelligence - {market_name}",
                        recorded_date=current_date_obj
                    )
                    
                    db.session.add(record)
                    records_created += 1
    
    # Commit all records
    try:
        db.session.commit()
        print(f"✅ Successfully seeded {records_created} market price records")
        print(f"📅 Date range: {start_date} to {end_date}")
        print(f"🌾 Crops: {', '.join(PRICE_RANGES.keys())}")
        print(f"📍 Counties: {', '.join(MARKET_LOCATIONS.keys())}")
        print(f"🏪 Markets per county: 5")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error seeding market data: {str(e)}")
        raise

if __name__ == "__main__":
    # Import app to ensure we're in Flask context
    from app import create_app
    app = create_app('development')
    
    with app.app_context():
        seed()
