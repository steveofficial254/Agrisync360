from datetime import date, timedelta
from sqlalchemy import func, and_, or_
from app.extensions import db
from app.models.market import Market
import logging

logger = logging.getLogger(__name__)

class MarketService:

    @staticmethod
    def get_current_prices(crop_name=None, county=None):
        """Get most recent price per crop per county with trend indicator"""
        try:
            # Base query
            query = Market.query
            
            if crop_name:
                query = query.filter(Market.crop_name == crop_name)
            
            if county:
                query = query.filter(Market.county == county)
            
            # Get latest price for each crop/county combination
            latest_prices = []
            
            # Get unique crop/county combinations
            if crop_name and county:
                combinations = [(crop_name, county)]
            elif crop_name:
                counties = db.session.query(Market.county).filter(Market.crop_name == crop_name).distinct().all()
                combinations = [(crop_name, c[0]) for c in counties]
            elif county:
                crops = db.session.query(Market.crop_name).filter(Market.county == county).distinct().all()
                combinations = [(c[0], county) for c in crops]
            else:
                # Get all combinations
                combinations = db.session.query(Market.crop_name, Market.county).distinct().all()
                combinations = [(c[0], c[1]) for c in combinations]
            
            for crop, cnty in combinations:
                # Get latest price for this combination
                latest = Market.query.filter(
                    Market.crop_name == crop,
                    Market.county == cnty
                ).order_by(Market.recorded_date.desc()).first()
                
                if latest:
                    # Calculate trend (compare to 7-day average)
                    seven_days_ago = latest.recorded_date - timedelta(days=7)
                    avg_7_days = db.session.query(func.avg(Market.price_per_kg)).filter(
                        Market.crop_name == crop,
                        Market.county == cnty,
                        Market.recorded_date >= seven_days_ago,
                        Market.recorded_date < latest.recorded_date
                    ).scalar()
                    
                    trend = "stable"
                    if avg_7_days:
                        change_pct = ((latest.price_per_kg - avg_7_days) / avg_7_days) * 100
                        if change_pct > 5:
                            trend = "up"
                        elif change_pct < -5:
                            trend = "down"
                    
                    price_data = latest.to_dict()
                    price_data["trend"] = trend
                    latest_prices.append(price_data)
            
            return latest_prices
            
        except Exception as e:
            logger.error(f"Get current prices error: {str(e)}")
            return []

    @staticmethod
    def get_price_history(crop_name, months=3):
        """Get monthly average prices for past N months"""
        try:
            months = int(months or 3)
            
            # Get monthly averages
            monthly_data = db.session.query(
                func.date_trunc("month", Market.recorded_date).label("month"),
                func.avg(Market.price_per_kg).label("avg_price"),
                func.min(Market.price_per_kg).label("min_price"),
                func.max(Market.price_per_kg).label("max_price")
            ).filter(
                Market.crop_name == crop_name,
                Market.recorded_date >= date.today() - timedelta(days=months * 30)
            ).group_by(
                func.date_trunc("month", Market.recorded_date)
            ).order_by(
                func.date_trunc("month", Market.recorded_date).asc()
            ).all()
            
            history = []
            for month_data in monthly_data:
                history.append({
                    "month": month_data.month.strftime("%Y-%m"),
                    "avg_price": round(float(month_data.avg_price), 2),
                    "min_price": round(float(month_data.min_price), 2),
                    "max_price": round(float(month_data.max_price), 2)
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Get price history error: {str(e)}")
            return []

    @staticmethod
    def calculate_profitability(crop_name, acres, county):
        """Calculate profitability analysis for a crop"""
        try:
            acres = float(acres)
            
            # Expected yields by crop (kg per acre)
            yields_per_acre = {
                'maize': 1500, 'beans': 600, 'potatoes': 8000,
                'tomatoes': 10000, 'wheat': 1200, 'cabbage': 15000,
                'kale': 8000, 'onions': 5000, 'sorghum': 1000
            }
            
            # Input costs per acre (KSH)
            input_costs = {
                'maize': 15000, 'beans': 12000, 'potatoes': 45000,
                'tomatoes': 60000, 'wheat': 18000, 'cabbage': 25000,
                'kale': 18000, 'onions': 30000, 'sorghum': 12000
            }
            
            # Get current market price for the crop in the county
            current_price = MarketService._get_current_price_for_county(crop_name, county)
            
            # Default values if not found
            expected_yield = yields_per_acre.get(crop_name, 1000)
            input_cost = input_costs.get(crop_name, 15000)
            
            # Calculate revenue, cost, profit
            total_yield_kg = expected_yield * acres
            revenue = total_yield_kg * current_price
            total_cost = input_cost * acres
            profit = revenue - total_cost
            roi = (profit / total_cost * 100) if total_cost > 0 else 0
            
            # Calculate break-even price
            break_even_price = total_cost / total_yield_kg if total_yield_kg > 0 else 0
            
            return {
                "crop_name": crop_name,
                "county": county,
                "acres": acres,
                "expected_yield_kg_per_acre": expected_yield,
                "total_expected_yield_kg": total_yield_kg,
                "current_market_price_ksh_per_kg": current_price,
                "input_cost_ksh_per_acre": input_cost,
                "total_input_cost_ksh": total_cost,
                "expected_revenue_ksh": round(revenue, 2),
                "expected_profit_ksh": round(profit, 2),
                "roi_percentage": round(roi, 2),
                "break_even_price_ksh_per_kg": round(break_even_price, 2),
                "profitable": profit > 0
            }
            
        except Exception as e:
            logger.error(f"Calculate profitability error: {str(e)}")
            return {"error": "Failed to calculate profitability"}

    @staticmethod
    def _get_current_price_for_county(crop_name, county):
        """Helper to get current price for specific crop and county"""
        latest = Market.query.filter(
            Market.crop_name == crop_name,
            Market.county == county
        ).order_by(Market.recorded_date.desc()).first()
        
        if latest:
            return latest.price_per_kg
        
        # Fallback to national average
        avg_price = db.session.query(func.avg(Market.price_per_kg)).filter(
            Market.crop_name == crop_name
        ).scalar()
        
        return float(avg_price) if avg_price else 50.0

    @staticmethod
    def detect_price_spikes(threshold_percent=30):
        """Compare today's prices to 7-day average and return significant changes"""
        try:
            threshold = float(threshold_percent)
            spikes = []
            
            # Get all unique crop/county combinations
            combinations = db.session.query(Market.crop_name, Market.county).distinct().all()
            
            for crop, county in combinations:
                # Get today's latest price
                today_price = Market.query.filter(
                    Market.crop_name == crop,
                    Market.county == county,
                    Market.recorded_date == date.today()
                ).first()
                
                if not today_price:
                    continue
                
                # Get 7-day average (excluding today)
                seven_days_ago = date.today() - timedelta(days=7)
                avg_7_days = db.session.query(func.avg(Market.price_per_kg)).filter(
                    Market.crop_name == crop,
                    Market.county == county,
                    Market.recorded_date >= seven_days_ago,
                    Market.recorded_date < date.today()
                ).scalar()
                
                if not avg_7_days:
                    continue
                
                # Calculate percentage change
                change_pct = ((today_price.price_per_kg - avg_7_days) / avg_7_days) * 100
                
                if abs(change_pct) >= threshold:
                    spikes.append({
                        "crop_name": crop,
                        "county": county,
                        "today_price": today_price.price_per_kg,
                        "seven_day_avg": avg_7_days,
                        "change_percentage": round(change_pct, 2),
                        "direction": "up" if change_pct > 0 else "down",
                        "market_name": today_price.market_name
                    })
            
            return spikes
            
        except Exception as e:
            logger.error(f"Detect price spikes error: {str(e)}")
            return []
