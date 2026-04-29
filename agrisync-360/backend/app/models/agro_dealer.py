import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Boolean, Integer, ARRAY, ForeignKey, DateTime

from app.extensions import db
from app.models.user import User


class AgroDealer(db.Model):
    __tablename__ = 'agro_dealer'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('user.id'), unique=True)
    business_name = db.Column(db.String(200), nullable=False)
    business_location = db.Column(db.String(200))
    county = db.Column(db.String(100))
    products = db.Column(ARRAY(db.String))  # list of products sold
    is_verified = db.Column(db.Boolean, default=False)
    monthly_reach = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    user = db.relationship('User', backref='agro_dealer_profile')
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "business_name": self.business_name,
            "business_location": self.business_location,
            "county": self.county,
            "products": self.products or [],
            "is_verified": self.is_verified,
            "monthly_reach": self.monthly_reach,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ProductRecommendation(db.Model):
    __tablename__ = 'product_recommendation'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agro_dealer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('agro_dealer.id'))
    crop_name = db.Column(db.String(100), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    product_type = db.Column(db.Enum(
        'fertilizer', 'pesticide', 'herbicide', 
        'seed', 'equipment', name='product_type_enum'
    ), nullable=False)
    description = db.Column(db.Text)
    price_ksh = db.Column(db.Float)
    available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "agro_dealer_id": str(self.agro_dealer_id),
            "crop_name": self.crop_name,
            "product_name": self.product_name,
            "product_type": self.product_type,
            "description": self.description,
            "price_ksh": self.price_ksh,
            "available": self.available,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
