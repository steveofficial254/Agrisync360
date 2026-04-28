import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Weather(db.Model):
    __tablename__ = "weather_cache"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    latitude = db.Column(db.Float, nullable=False, index=True)
    longitude = db.Column(db.Float, nullable=False, index=True)
    county = db.Column(db.String(100), nullable=True)
    forecast_date = db.Column(db.Date, nullable=False, index=True)
    temperature_max = db.Column(db.Float, nullable=True)
    temperature_min = db.Column(db.Float, nullable=True)
    precipitation_mm = db.Column(db.Float, nullable=True)
    humidity_percent = db.Column(db.Float, nullable=True)
    wind_speed_kmh = db.Column(db.Float, nullable=True)
    uv_index = db.Column(db.Float, nullable=True)
    weather_code = db.Column(db.Integer, nullable=True)
    weather_description = db.Column(db.String(160), nullable=True)
    disease_risk_level = db.Column(db.Enum("low", "medium", "high", "very_high", name="disease_risk"), default="low", nullable=False)
    frost_risk = db.Column(db.Boolean, default=False, nullable=False)
    planting_window = db.Column(db.Boolean, default=False, nullable=False)
    fetched_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)

    @property
    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at

    def to_dict(self):
        return {
            "id": str(self.id),
            "latitude": self.latitude,
            "longitude": self.longitude,
            "county": self.county,
            "forecast_date": self.forecast_date.isoformat() if self.forecast_date else None,
            "temperature_max": self.temperature_max,
            "temperature_min": self.temperature_min,
            "precipitation_mm": self.precipitation_mm,
            "humidity_percent": self.humidity_percent,
            "wind_speed_kmh": self.wind_speed_kmh,
            "uv_index": self.uv_index,
            "weather_code": self.weather_code,
            "weather_description": self.weather_description,
            "disease_risk_level": self.disease_risk_level,
            "frost_risk": self.frost_risk,
            "planting_window": self.planting_window,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }
