import uuid
from datetime import datetime, timezone, date
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

class YieldRecord(db.Model):
    __tablename__ = "yield_records"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100), nullable=True)
    season = db.Column(db.String(100), nullable=True)
    area_planted_acres = db.Column(db.Float, nullable=False)
    quantity_harvested_kg = db.Column(db.Float, nullable=False)
    quantity_sold_kg = db.Column(db.Float, nullable=True)
    price_per_kg = db.Column(db.Float, nullable=True)
    total_revenue_ksh = db.Column(db.Float, nullable=True)
    seed_cost_ksh = db.Column(db.Float, nullable=True)
    fertilizer_cost_ksh = db.Column(db.Float, nullable=True)
    pesticide_cost_ksh = db.Column(db.Float, nullable=True)
    labor_cost_ksh = db.Column(db.Float, nullable=True)
    harvest_date = db.Column(db.Date, nullable=True)
    planting_date = db.Column(db.Date, nullable=True)
    challenges_faced = db.Column(db.Text, nullable=True)
    ai_summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        # Calculate derived fields
        total_costs = (self.seed_cost_ksh or 0) + (self.fertilizer_cost_ksh or 0) + \
                     (self.pesticide_cost_ksh or 0) + (self.labor_cost_ksh or 0)
        net_profit = (self.total_revenue_ksh or 0) - total_costs
        roi_percent = (net_profit / total_costs * 100) if total_costs > 0 else 0
        yield_per_acre = (self.quantity_harvested_kg / self.area_planted_acres) if self.area_planted_acres > 0 else 0
        
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "crop_name": self.crop_name,
            "variety": self.variety,
            "season": self.season,
            "area_planted_acres": self.area_planted_acres,
            "quantity_harvested_kg": self.quantity_harvested_kg,
            "quantity_sold_kg": self.quantity_sold_kg,
            "price_per_kg": self.price_per_kg,
            "total_revenue_ksh": self.total_revenue_ksh,
            "seed_cost_ksh": self.seed_cost_ksh,
            "fertilizer_cost_ksh": self.fertilizer_cost_ksh,
            "pesticide_cost_ksh": self.pesticide_cost_ksh,
            "labor_cost_ksh": self.labor_cost_ksh,
            "harvest_date": self.harvest_date.isoformat() if self.harvest_date else None,
            "planting_date": self.planting_date.isoformat() if self.planting_date else None,
            "challenges_faced": self.challenges_faced,
            "ai_summary": self.ai_summary,
            "net_profit_ksh": round(net_profit, 2),
            "roi_percent": round(roi_percent, 2),
            "yield_per_acre": round(yield_per_acre, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
