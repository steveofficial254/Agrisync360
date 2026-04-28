import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db

from geoalchemy2 import Geometry


class Farm(db.Model):
    __tablename__ = "farms"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(Geometry("POINT", srid=4326), nullable=False)
    county = db.Column(db.String(100), nullable=False, index=True)
    sub_county = db.Column(db.String(100), nullable=True)
    size_acres = db.Column(db.Float, nullable=False)
    soil_type = db.Column(db.Enum("clay", "loam", "sandy", "silt", "peat", name="soil_type"), nullable=False)
    water_source = db.Column(db.Enum("rain", "irrigation", "river", "borehole", "none", name="water_source"), nullable=False)
    elevation_meters = db.Column(db.Float, nullable=True)
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    farmer = db.relationship("Farmer", back_populates="farms")
    crop_subscriptions = db.relationship("Crop", back_populates="farm", lazy="dynamic", cascade="all, delete-orphan")

    @staticmethod
    def build_point(lat: float, lon: float):
        return f"SRID=4326;POINT({lon} {lat})"

    def get_coordinates(self):
        if not self.location:
            return (None, None)
        raw = getattr(self.location, "desc", "") or str(self.location)
        if "POINT(" in raw:
            coords = raw.split("POINT(")[-1].split(")")[0].strip().split()
            if len(coords) == 2:
                lon, lat = coords
                return (float(lat), float(lon))
        return (None, None)

    def to_dict(self):
        lat, lon = self.get_coordinates()
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "name": self.name,
            "latitude": lat,
            "longitude": lon,
            "county": self.county,
            "sub_county": self.sub_county,
            "size_acres": self.size_acres,
            "soil_type": self.soil_type,
            "water_source": self.water_source,
            "elevation_meters": self.elevation_meters,
            "is_primary": self.is_primary,
        }
