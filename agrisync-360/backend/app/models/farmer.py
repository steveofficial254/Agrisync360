import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Farmer(db.Model):
    __tablename__ = "farmers"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    first_name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    national_id = db.Column(db.String(20), unique=True, nullable=True, index=True)
    county = db.Column(db.String(100), nullable=False, index=True)
    sub_county = db.Column(db.String(100), nullable=True)
    ward = db.Column(db.String(100), nullable=True)
    village = db.Column(db.String(120), nullable=True)
    profile_photo = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="farmer_profile")
    farms = db.relationship("Farm", back_populates="farmer", lazy="dynamic", cascade="all, delete-orphan")
    subscriptions = db.relationship("Payment", back_populates="farmer", lazy="dynamic")
    alerts = db.relationship("Alert", back_populates="farmer", lazy="dynamic", cascade="all, delete-orphan")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "national_id": self.national_id,
            "county": self.county,
            "sub_county": self.sub_county,
            "ward": self.ward,
            "village": self.village,
            "profile_photo": self.profile_photo,
        }
