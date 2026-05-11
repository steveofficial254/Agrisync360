import uuid
from datetime import datetime, timezone, date

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Boolean, Integer, ARRAY, ForeignKey, DateTime, Date

from app.extensions import db
from app.models.user import User


class NGOProfile(db.Model):
    __tablename__ = 'ngo_profile'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), unique=True)
    organization_name = db.Column(db.String(200), nullable=False)
    organization_type = db.Column(db.Enum(
        'ngo', 'cbo', 'government', 'cooperative', 
        'development_partner', name='org_type_enum'
    ), nullable=False)
    focus_counties = db.Column(ARRAY(db.String))
    focus_crops = db.Column(ARRAY(db.String))
    total_beneficiaries_target = db.Column(db.Integer)
    is_verified = db.Column(db.Boolean, default=False)
    contract_start = db.Column(db.Date)
    contract_end = db.Column(db.Date)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    user = db.relationship('User', backref='ngo_profile')
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "organization_name": self.organization_name,
            "organization_type": self.organization_type,
            "focus_counties": self.focus_counties or [],
            "focus_crops": self.focus_crops or [],
            "total_beneficiaries_target": self.total_beneficiaries_target,
            "is_verified": self.is_verified,
            "contract_start": self.contract_start.isoformat() if self.contract_start else None,
            "contract_end": self.contract_end.isoformat() if self.contract_end else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class BulkFarmerRegistration(db.Model):
    __tablename__ = 'bulk_farmer_registration'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ngo_id = db.Column(UUID(as_uuid=True), db.ForeignKey('ngo_profile.id'))
    batch_name = db.Column(db.String(200), nullable=False)
    total_farmers = db.Column(db.Integer, default=0)
    successful_registrations = db.Column(db.Integer, default=0)
    failed_registrations = db.Column(db.Integer, default=0)
    county = db.Column(db.String(100))
    status = db.Column(db.Enum(
        'pending', 'processing', 'completed', 'failed',
        name='batch_status_enum'
    ), default='pending')
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = db.Column(db.DateTime(timezone=True))
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "ngo_id": str(self.ngo_id),
            "batch_name": self.batch_name,
            "total_farmers": self.total_farmers,
            "successful_registrations": self.successful_registrations,
            "failed_registrations": self.failed_registrations,
            "county": self.county,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
