"""
AgriSync 360 — Market Pro Models
Price Alerts, Buyer Directory, Cooperatives
"""
from app.extensions import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID


class PriceAlert(db.Model):
    """Farmer-set price target alerts"""
    __tablename__ = 'price_alert'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    crop_name = db.Column(db.String(100), nullable=False)
    target_price_ksh = db.Column(db.Float, nullable=False)
    condition = db.Column(db.Enum(
        'above', 'below', 'equals',
        name='alert_condition_enum'
    ), default='above')
    county = db.Column(db.String(100))
    notify_via = db.Column(db.ARRAY(db.String),
                           default=['sms'])
    is_active = db.Column(db.Boolean, default=True)
    triggered_count = db.Column(db.Integer, default=0)
    last_triggered = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='price_alerts')

    def to_dict(self):
        return {
            'id': str(self.id),
            'crop_name': self.crop_name,
            'target_price_ksh': self.target_price_ksh,
            'condition': self.condition,
            'county': self.county,
            'notify_via': self.notify_via or ['sms'],
            'is_active': self.is_active,
            'triggered_count': self.triggered_count,
            'last_triggered': self.last_triggered.isoformat()
                if self.last_triggered else None,
            'created_at': self.created_at.isoformat(),
        }


class BuyerDirectory(db.Model):
    """Verified buyers and offtakers"""
    __tablename__ = 'buyer_directory'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    business_name = db.Column(db.String(300), nullable=False)
    contact_name = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(200))
    buyer_type = db.Column(db.Enum(
        'trader', 'exporter', 'processor', 'retailer',
        'hotel', 'school', 'ngo', 'government',
        name='buyer_type_enum'
    ))
    crops_wanted = db.Column(db.ARRAY(db.String))
    counties_served = db.Column(db.ARRAY(db.String))
    minimum_quantity_kg = db.Column(db.Float)
    quality_requirements = db.Column(db.Text)
    payment_terms = db.Column(db.Text)
    certifications_required = db.Column(db.ARRAY(db.String))
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'business_name': self.business_name,
            'contact_name': self.contact_name,
            'phone': self.phone,
            'email': self.email,
            'buyer_type': self.buyer_type,
            'crops_wanted': self.crops_wanted or [],
            'counties_served': self.counties_served or [],
            'minimum_quantity_kg': self.minimum_quantity_kg,
            'quality_requirements': self.quality_requirements,
            'payment_terms': self.payment_terms,
            'certifications_required': self.certifications_required or [],
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat(),
        }
