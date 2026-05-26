import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

class Greenhouse(db.Model):
    __tablename__ = "greenhouses"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    greenhouse_type = db.Column(db.String(100), nullable=False)
    length_meters = db.Column(db.Float, nullable=True)
    width_meters = db.Column(db.Float, nullable=True)
    height_meters = db.Column(db.Float, nullable=True)
    covering_material = db.Column(db.String(100), nullable=True)
    irrigation_system = db.Column(db.String(100), nullable=True)
    current_crop = db.Column(db.String(100), nullable=True)
    planting_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    readings = db.relationship("GreenhouseReading", backref="greenhouse", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "name": self.name,
            "greenhouse_type": self.greenhouse_type,
            "length_meters": self.length_meters,
            "width_meters": self.width_meters,
            "height_meters": self.height_meters,
            "covering_material": self.covering_material,
            "irrigation_system": self.irrigation_system,
            "current_crop": self.current_crop,
            "planting_date": self.planting_date.isoformat() if self.planting_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class GreenhouseReading(db.Model):
    __tablename__ = "greenhouse_readings"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    greenhouse_id = db.Column(UUID(as_uuid=True), db.ForeignKey("greenhouses.id", ondelete="CASCADE"), nullable=False)
    temperature_celsius = db.Column(db.Float, nullable=True)
    humidity_percent = db.Column(db.Float, nullable=True)
    ph_level = db.Column(db.Float, nullable=True)
    ec_level = db.Column(db.Float, nullable=True)
    soil_moisture_percent = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        alerts = []
        if self.temperature_celsius:
            if self.temperature_celsius > 35:
                alerts.append("High temperature alert")
            elif self.temperature_celsius < 15:
                alerts.append("Low temperature alert")
        if self.humidity_percent and self.humidity_percent > 90:
            alerts.append("High humidity - disease risk")
        if self.ph_level and (self.ph_level < 5.5 or self.ph_level > 7.5):
            alerts.append("pH outside optimal range")
        
        return {
            "id": str(self.id),
            "greenhouse_id": str(self.greenhouse_id),
            "temperature_celsius": self.temperature_celsius,
            "humidity_percent": self.humidity_percent,
            "ph_level": self.ph_level,
            "ec_level": self.ec_level,
            "soil_moisture_percent": self.soil_moisture_percent,
            "alerts": alerts,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
