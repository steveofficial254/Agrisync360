import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    plan = db.Column(db.Enum("basic_monthly", "pro_monthly", "basic_annual", "pro_annual", "ngo_annual", "county_annual", name="subscription_plan"), nullable=False)
    amount_ksh = db.Column(db.Float, nullable=False)
    mpesa_reference = db.Column(db.String(100), unique=True, nullable=True)
    checkout_request_id = db.Column(db.String(120), nullable=True, index=True)
    merchant_request_id = db.Column(db.String(120), nullable=True)
    mpesa_receipt_number = db.Column(db.String(120), nullable=True)
    phone_number = db.Column(db.String(20), nullable=False)
    status = db.Column(db.Enum("pending", "completed", "failed", "cancelled", "refunded", name="payment_status"), default="pending", nullable=False)
    payment_date = db.Column(db.DateTime(timezone=True), nullable=True)
    subscription_start = db.Column(db.Date, nullable=True)
    subscription_end = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    farmer = db.relationship("Farmer", back_populates="subscriptions")

    @property
    def is_active(self):
        return self.status == "completed" and self.subscription_end is not None and self.subscription_end >= date.today()

    def to_dict(self):
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "plan": self.plan,
            "amount_ksh": self.amount_ksh,
            "mpesa_reference": self.mpesa_reference,
            "checkout_request_id": self.checkout_request_id,
            "merchant_request_id": self.merchant_request_id,
            "mpesa_receipt_number": self.mpesa_receipt_number,
            "phone_number": self.phone_number,
            "status": self.status,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "subscription_start": self.subscription_start.isoformat() if self.subscription_start else None,
            "subscription_end": self.subscription_end.isoformat() if self.subscription_end else None,
            "is_active": self.is_active,
        }
