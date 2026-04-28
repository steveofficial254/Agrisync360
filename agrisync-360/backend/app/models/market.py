import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Market(db.Model):
    __tablename__ = "market_prices"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = db.Column(db.String(50), nullable=False, index=True)
    county = db.Column(db.String(100), nullable=False, index=True)
    market_name = db.Column(db.String(120), nullable=False)
    price_per_kg = db.Column(db.Float, nullable=False)
    unit = db.Column(db.Enum("kg", "bag_90kg", "bag_50kg", "crate", "bunch", name="market_unit"), default="kg", nullable=False)
    price_per_unit = db.Column(db.Float, nullable=False)
    demand_level = db.Column(db.Enum("low", "medium", "high", "very_high", name="market_demand"), default="medium", nullable=False)
    source = db.Column(db.String(120), nullable=False)
    recorded_date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "crop_name": self.crop_name,
            "county": self.county,
            "market_name": self.market_name,
            "price_per_kg": self.price_per_kg,
            "unit": self.unit,
            "price_per_unit": self.price_per_unit,
            "demand_level": self.demand_level,
            "source": self.source,
            "recorded_date": self.recorded_date.isoformat() if self.recorded_date else None,
        }
