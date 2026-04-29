from datetime import date, timedelta
from app.extensions import celery, db
from app.models.market import Market
from app.models.payment import Payment
from app.models.farmer import Farmer
from app.services.sms_service import SMSService
from app.services.market_service import MarketService
import logging

logger = logging.getLogger(__name__)


@celery.task
def scrape_market_prices():
    """Daily task to scrape and seed market prices"""
    try:
        # In production, this would integrate with real market APIs
        # For now, we'll generate sample data with realistic variations
        
        # Base prices for different crops
        base_prices = {
            'maize': 50, 'beans': 150, 'potatoes': 40,
            'tomatoes': 80, 'wheat': 55, 'cabbage': 35,
            'kale': 25, 'onions': 75, 'sorghum': 45
        }
        
        # Major counties with markets
        counties = [
            'Nairobi', 'Nakuru', 'Meru', 'Kisumu', 'Mombasa',
            'Kiambu', 'Uasin Gishu', 'Kericho', 'Bungoma', 'Kakamega'
        ]
        
        markets_by_county = {
            'Nairobi': ['Wakulima Market', 'City Market', 'Kenyatta Market'],
            'Nakuru': ['Nakuru Market', 'Kabarak Market', 'Njoro Market'],
            'Meru': ['Meru Market', 'Nkubu Market', 'Chuka Market'],
            'Kisumu': ['Kisumu Market', 'Ahero Market', 'Muhoroni Market'],
            'Mombasa': ['Kongowea Market', 'Mombasa Market', 'Likoni Market'],
            'Kiambu': ['Kiambu Market', 'Thika Market', 'Kikuyu Market'],
            'Uasin Gishu': ['Eldoret Market', 'Moiben Market', 'Burnt Forest Market'],
            'Kericho': ['Kericho Market', 'Kipkelion Market', 'Litein Market'],
            'Bungoma': ['Bungoma Market', 'Kimilili Market', 'Webuye Market'],
            'Kakamega': ['Kakamega Market', 'Shinyalu Market', 'Ilesi Market']
        }
        
        records_added = 0
        
        for county in counties:
            markets = markets_by_county.get(county, [f"{county} Market"])
            
            for crop_name, base_price in base_prices.items():
                for market_name in markets:
                    # Add daily variation (±15%)
                    import random
                    variation = random.uniform(0.85, 1.15)
                    final_price = round(base_price * variation, 2)
                    
                    # Determine demand level based on price
                    if final_price > base_price * 1.1:
                        demand_level = random.choice(['high', 'very_high'])
                    elif final_price < base_price * 0.9:
                        demand_level = random.choice(['low', 'medium'])
                    else:
                        demand_level = 'medium'
                    
                    # Check if record already exists for today
                    existing = Market.query.filter_by(
                        crop_name=crop_name,
                        county=county,
                        market_name=market_name,
                        recorded_date=date.today()
                    ).first()
                    
                    if not existing:
                        record = Market(
                            crop_name=crop_name,
                            county=county,
                            market_name=market_name,
                            price_per_kg=final_price,
                            unit='kg',
                            price_per_unit=final_price,
                            demand_level=demand_level,
                            source='AgriSync Market Intelligence',
                            recorded_date=date.today()
                        )
                        
                        db.session.add(record)
                        records_added += 1
        
        db.session.commit()
        
        logger.info(f"Market prices scraped: {records_added} new records added")
        return {
            "status": "success",
            "records_added": records_added,
            "date": date.today().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Market scraping error: {str(e)}")
        db.session.rollback()
        return {
            "status": "error",
            "message": str(e)
        }


@celery.task
def send_market_alerts():
    """Send SMS alerts for significant price movements to pro subscribers"""
    try:
        # Detect price spikes (30%+ change from 7-day average)
        spikes = MarketService.detect_price_spikes(threshold_percent=30)
        
        if not spikes:
            logger.info("No significant price movements detected")
            return {"status": "success", "alerts_sent": 0, "spikes_detected": 0}
        
        # Get pro subscribers
        pro_subscribers = db.session.query(Farmer, Payment).join(Payment).filter(
            Payment.status == 'completed',
            Payment.subscription_end >= date.today(),
            Payment.plan.in_(['pro_monthly', 'pro_annual'])
        ).all()
        
        alerts_sent = 0
        
        for farmer, payment in pro_subscribers:
            # Check if farmer has crops in affected counties
            farmer_counties = set()
            for farm in farmer.farms:
                if farm.county in [spike['county'] for spike in spikes]:
                    farmer_counties.add(farm.county)
            
            if farmer_counties:
                # Build alert message
                relevant_spikes = [s for s in spikes if s['county'] in farmer_counties]
                
                if relevant_spikes:
                    spike = relevant_spikes[0]  # Send most significant spike
                    message = (
                        f"AgriSync Market Alert - {spike['crop_name'].title()}:\n"
                        f"Price in {spike['county']} is {spike['direction']} "
                        f"{abs(spike['change_percentage'])}% today!\n"
                        f"Current: KSH {spike['today_price']:.0f}/kg\n"
                        f"7-day avg: KSH {spike['seven_day_avg']:.0f}/kg\n"
                        f"Market: {spike['market_name']}\n"
                        f"AgriSync 360 Market Intelligence"
                    )
                    
                    result = SMSService.send_sms(
                        farmer.user.phone, message,
                        message_type='market_alert',
                        farmer_id=farmer.id
                    )
                    
                    if result.get('status') in ['Success', 'sent', 'dev_mode']:
                        alerts_sent += 1
        
        logger.info(f"Market alerts sent: {alerts_sent} alerts, {len(spikes)} spikes detected")
        return {
            "status": "success",
            "alerts_sent": alerts_sent,
            "spikes_detected": len(spikes),
            "spikes": spikes
        }
        
    except Exception as e:
        logger.error(f"Market alerts error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
