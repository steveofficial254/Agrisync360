import uuid
from datetime import datetime, timezone, date
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

class FarmOperation(db.Model):
    __tablename__ = "farm_operations"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    operation_type = db.Column(db.String(100), nullable=False)
    operation_date = db.Column(db.Date, nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    cost_ksh = db.Column(db.Float, nullable=False)
    labor_count = db.Column(db.Integer, nullable=True)
    duration_hours = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "operation_type": self.operation_type,
            "operation_date": self.operation_date.isoformat() if self.operation_date else None,
            "crop_name": self.crop_name,
            "description": self.description,
            "cost_ksh": self.cost_ksh,
            "labor_count": self.labor_count,
            "duration_hours": self.duration_hours,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class InventoryItem(db.Model):
    __tablename__ = "inventory_items"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    minimum_stock = db.Column(db.Float, nullable=True)
    unit_cost_ksh = db.Column(db.Float, nullable=False)
    supplier = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        is_low_stock = self.minimum_stock and self.quantity < self.minimum_stock
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "item_name": self.item_name,
            "category": self.category,
            "quantity": self.quantity,
            "unit": self.unit,
            "minimum_stock": self.minimum_stock,
            "unit_cost_ksh": self.unit_cost_ksh,
            "supplier": self.supplier,
            "location": self.location,
            "total_value_ksh": round(self.quantity * self.unit_cost_ksh, 2),
            "is_low_stock": is_low_stock,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Batch(db.Model):
    __tablename__ = "batches"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100), nullable=True)
    harvest_date = db.Column(db.Date, nullable=True)
    quantity_kg = db.Column(db.Float, nullable=False)
    quality_grade = db.Column(db.String(50), nullable=False)
    destination = db.Column(db.String(255), nullable=True)
    buyer_name = db.Column(db.String(255), nullable=True)
    sale_price_per_kg = db.Column(db.Float, nullable=True)
    batch_number = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), default="harvested")
    dispatch_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.batch_number:
            # Auto-generate batch number
            crop_code = self.crop_name[:3].upper() if self.crop_name else "UNK"
            date_str = datetime.now().strftime("%Y%m%d")
            self.batch_number = f"{crop_code}-{date_str}-{uuid.uuid4().hex[:6].upper()}"

    def to_dict(self):
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "crop_name": self.crop_name,
            "variety": self.variety,
            "harvest_date": self.harvest_date.isoformat() if self.harvest_date else None,
            "quantity_kg": self.quantity_kg,
            "quality_grade": self.quality_grade,
            "destination": self.destination,
            "buyer_name": self.buyer_name,
            "sale_price_per_kg": self.sale_price_per_kg,
            "batch_number": self.batch_number,
            "status": self.status,
            "dispatch_date": self.dispatch_date.isoformat() if self.dispatch_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class ComplianceRecord(db.Model):
    __tablename__ = "compliance_records"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    compliance_type = db.Column(db.String(100), nullable=False)
    certificate_number = db.Column(db.String(100), nullable=True)
    issuing_body = db.Column(db.String(255), nullable=True)
    issue_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), default="active")
    audit_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        is_expiring_soon = False
        if self.expiry_date:
            days_until_expiry = (self.expiry_date - date.today()).days
            is_expiring_soon = days_until_expiry <= 30 and days_until_expiry > 0
        
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "compliance_type": self.compliance_type,
            "certificate_number": self.certificate_number,
            "issuing_body": self.issuing_body,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "status": self.status,
            "audit_notes": self.audit_notes,
            "is_expiring_soon": is_expiring_soon,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
