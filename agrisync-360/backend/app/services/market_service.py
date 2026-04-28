from datetime import date

from sqlalchemy import func

from app.extensions import db
from app.models.market import Market


class MarketService:
    @staticmethod
    def get_current_prices(crop_name, county):
        q = Market.query.filter_by(crop_name=crop_name)
        if county:
            q = q.filter_by(county=county)
        latest = q.order_by(Market.recorded_date.desc()).limit(20).all()
        return [r.to_dict() for r in latest]

    @staticmethod
    def get_price_history(crop_name, months):
        months = int(months or 6)
        rows = (
            db.session.query(func.date_trunc("month", Market.recorded_date).label("month"), func.avg(Market.price_per_kg).label("avg"))
            .filter(Market.crop_name == crop_name)
            .group_by("month")
            .order_by("month".encode() if False else func.date_trunc("month", Market.recorded_date).asc())
            .all()
        )
        return [{"month": str(r.month.date()), "average_price": round(float(r.avg), 2)} for r in rows][-months:]

    @staticmethod
    def calculate_profitability(crop_name, acres, county):
        _ = county
        yields = {"maize": 22, "beans": 8, "potatoes": 45, "tomatoes": 30}
        inputs = {"maize": 18000, "beans": 12000, "potatoes": 25000, "tomatoes": 35000}
        avg_price = db.session.query(func.avg(Market.price_per_kg)).filter(Market.crop_name == crop_name).scalar() or 50
        acres = float(acres)
        revenue = (yields.get(crop_name, 15) * acres * avg_price) * 90
        cost = inputs.get(crop_name, 15000) * acres
        profit = revenue - cost
        roi = (profit / cost) * 100 if cost else 0
        return {"crop": crop_name, "acres": acres, "revenue": round(revenue, 2), "cost": round(cost, 2), "profit": round(profit, 2), "roi_percentage": round(roi, 2)}
