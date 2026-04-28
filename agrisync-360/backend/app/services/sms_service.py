from datetime import datetime, timezone

import africastalking

from app.extensions import db
from app.models.sms import SMS


class SMSService:
    def __init__(self):
        from flask import current_app

        africastalking.initialize(current_app.config.get("AT_USERNAME"), current_app.config.get("AT_API_KEY"))
        self.sms = africastalking.SMS
        self.sender = current_app.config.get("AT_SENDER_ID")

    def send_sms(self, phone_number, message, farmer_id=None, message_type="general"):
        log = SMS(farmer_id=farmer_id, phone_number=phone_number, message=message, message_type=message_type, status="pending")
        db.session.add(log)
        db.session.flush()
        try:
            result = self.sms.send(message, [phone_number], sender_id=self.sender)
            recipient = result.get("SMSMessageData", {}).get("Recipients", [{}])[0]
            log.status = "sent" if recipient.get("statusCode") in (101, "101") else "failed"
            log.at_message_id = recipient.get("messageId")
            log.cost = float(str(recipient.get("cost", "KES 0")).split(" ")[-1]) if recipient.get("cost") else None
            log.sent_at = datetime.now(timezone.utc)
            db.session.commit()
            return {"message_id": log.at_message_id, "status": log.status}
        except Exception:
            log.status = "failed"
            db.session.commit()
            return {"message_id": None, "status": "failed"}

    def send_bulk_sms(self, phone_numbers, message, message_type):
        sent = 0
        failed = 0
        for i in range(0, len(phone_numbers), 100):
            batch = phone_numbers[i:i + 100]
            for phone in batch:
                result = self.send_sms(phone, message, message_type=message_type)
                if result["status"] == "sent":
                    sent += 1
                else:
                    failed += 1
        return {"sent": sent, "failed": failed}

    def send_otp(self, phone_number, otp_code):
        msg = f"Your AgriSync 360 verification code is {otp_code}. Valid for 10 minutes. Do not share this code."
        return self.send_sms(phone_number, msg, message_type="otp")

    def send_weather_alert(self, farmer, weather_data):
        if weather_data.get("disease_risk_level") not in ["high", "very_high"] and not weather_data.get("frost_risk"):
            return {"status": "skipped"}
        msg = f"AgriSync Alert: Risk {weather_data.get('disease_risk_level')}. Rain {weather_data.get('precipitation_mm')}mm. Take preventive action."
        return self.send_sms(farmer.user.phone, msg, farmer_id=farmer.id, message_type="weather_alert")

    def send_subscription_confirmation(self, farmer, payment):
        msg = f"Payment confirmed. Plan: {payment.plan}. Valid until {payment.subscription_end}. Thank you for using AgriSync 360."
        return self.send_sms(farmer.user.phone, msg, farmer_id=farmer.id, message_type="subscription")
