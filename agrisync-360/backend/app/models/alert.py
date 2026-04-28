import uuid
from datetime import datetime, date, timezone, timedelta

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = db.Column(db.Enum("weather", "disease_risk", "planting_window", "market_price", "subscription_expiry", "general", name="alert_type"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Enum("info", "warning", "critical", name="alert_severity"), default="info", nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    sent_via_sms = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    farmer = db.relationship("Farmer", back_populates="alerts")

    def to_dict(self):
        return {
            "id": str(self.id),
            "farmer_id": str(self.farmer_id),
            "alert_type": self.alert_type,
            "title": self.title,
            "message": self.message,
            "severity": self.severity,
            "is_read": self.is_read,
            "sent_via_sms": self.sent_via_sms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
