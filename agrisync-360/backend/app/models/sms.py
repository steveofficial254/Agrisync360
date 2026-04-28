import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class SMS(db.Model):
    __tablename__ = "sms_logs"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="SET NULL"), nullable=True, index=True)
    phone_number = db.Column(db.String(20), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.Enum("otp", "advisory", "weather_alert", "market_alert", "subscription", "bulk", "ussd_response", name="sms_message_type"), nullable=False)
    status = db.Column(db.Enum("pending", "sent", "delivered", "failed", name="sms_status"), default="pending", nullable=False)
    at_message_id = db.Column(db.String(120), nullable=True)
    cost = db.Column(db.Float, nullable=True)
    sent_at = db.Column(db.DateTime(timezone=True), nullable=True)
    delivered_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id) if self.farmer_id else None,
            "phone_number": self.phone_number,
            "message": self.message,
            "message_type": self.message_type,
            "status": self.status,
            "at_message_id": self.at_message_id,
            "cost": self.cost,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
        }
