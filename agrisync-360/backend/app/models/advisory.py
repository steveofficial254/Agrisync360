import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db

from sqlalchemy.dialects.postgresql import ARRAY


class Advisory(db.Model):
    __tablename__ = "advisories"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = db.Column(db.Enum("maize", "beans", "potatoes", "tomatoes", "tea", "wheat", "rice", "cassava", "sorghum", "cabbage", "kale", "onions", "other", name="advisory_crop_name"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    advisory_type = db.Column(db.Enum("planting", "nutrition", "pest_control", "irrigation", "harvest", "general", "disease_alert", "weather_alert", name="advisory_type"), nullable=False, index=True)
    growth_stage = db.Column(db.String(50), nullable=True)
    season = db.Column(db.Enum("long_rains", "short_rains", "dry_season", "all", name="advisory_season"), default="all", nullable=False)
    counties_applicable = db.Column(ARRAY(db.String), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": str(self.id),
            "crop_name": self.crop_name,
            "title": self.title,
            "content": self.content,
            "advisory_type": self.advisory_type,
            "growth_stage": self.growth_stage,
            "season": self.season,
            "counties_applicable": self.counties_applicable,
            "is_active": self.is_active,
        }
