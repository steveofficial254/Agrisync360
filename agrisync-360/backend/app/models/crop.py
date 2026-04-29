import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Crop(db.Model):
    __tablename__ = "crops"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = db.Column(db.Enum("maize", "beans", "potatoes", "tomatoes", "tea", "wheat", "rice", "cassava", "sorghum", "cabbage", "kale", "onions", "other", name="crop_name"), nullable=False, index=True)
    variety = db.Column(db.String(150), nullable=True)
    planting_date = db.Column(db.Date, nullable=False)
    expected_harvest_date = db.Column(db.Date, nullable=True)
    area_planted_acres = db.Column(db.Float, nullable=False)
    growth_stage = db.Column(db.Enum("land_prep", "planting", "germination", "vegetative", "flowering", "fruiting", "maturity", "harvested", name="growth_stage"), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    farm = db.relationship("Farm", back_populates="crop_subscriptions")

    @property
    def days_since_planting(self):
        return (date.today() - self.planting_date).days if self.planting_date else None

    @property
    def days_to_harvest(self):
        if not self.expected_harvest_date:
            return None
        return (self.expected_harvest_date - date.today()).days

    def get_current_growth_stage(self):
        """Auto-calculate growth stage based on days since planting"""
        days = self.days_since_planting
        if days is None or days < 0:
            return "land_prep"
        elif days <= 7:
            return "germination"
        elif days <= 21:
            return "vegetative"
        elif days <= 45:
            return "vegetative"
        elif days <= 60:
            return "flowering"
        elif days <= 80:
            return "fruiting"
        elif days <= 120:
            return "maturity"
        else:
            return "harvested"

    def to_dict(self):
        return {
            "id": str(self.id),
            "farm_id": str(self.farm_id),
            "crop_name": self.crop_name,
            "variety": self.variety,
            "planting_date": self.planting_date.isoformat() if self.planting_date else None,
            "expected_harvest_date": self.expected_harvest_date.isoformat() if self.expected_harvest_date else None,
            "area_planted_acres": self.area_planted_acres,
            "growth_stage": self.growth_stage,
            "is_active": self.is_active,
            "days_since_planting": self.days_since_planting,
            "days_to_harvest": self.days_to_harvest,
        }
