import africastalking
import os
import logging
from app.models.sms import SMS
from app.extensions import db
from datetime import datetime

logger = logging.getLogger(__name__)

class SMSService:

    _initialized = False
    _sms = None

    @classmethod
    def initialize(cls):
        if not cls._initialized:
            username = os.getenv('AT_USERNAME', 'sandbox')
            api_key = os.getenv('AT_API_KEY', '')
            if api_key:
                africastalking.initialize(username, api_key)
                cls._sms = africastalking.SMS
                cls._initialized = True
                logger.info("Africa's Talking initialized")
            else:
                logger.warning("AT_API_KEY not set — SMS disabled")

    @classmethod
    def send_sms(cls, phone_number, message, message_type='general',
                 farmer_id=None):
        cls.initialize()
        
        # Normalize phone
        phone = cls.normalize_phone(phone_number)
        
        # Create log entry
        log = SMS(
            farmer_id=farmer_id,
            phone_number=phone,
            message=message,
            message_type=message_type,
            status='pending',
            created_at=datetime.utcnow()
        )
        
        try:
            db.session.add(log)
            db.session.commit()
            
            if not cls._initialized:
                # Dev mode — log and return without sending
                logger.info(f"SMS (dev mode) to {phone}: {message}")
                log.status = 'sent'
                log.sent_at = datetime.utcnow()
                db.session.commit()
                return {"status": "dev_mode", "message_id": log.id}
            
            sender_id = os.getenv('AT_SENDER_ID', 'AGRISYNC')
            response = cls._sms.send(
                message=message,
                recipients=[phone],
                sender_id=sender_id
            )
            
            recipients = response.get('SMSMessageData', {}) \
                                 .get('Recipients', [])
            
            if recipients:
                recipient = recipients[0]
                status = recipient.get('status', 'unknown')
                at_id = recipient.get('messageId', '')
                cost = recipient.get('cost', '0')
                
                log.status = 'sent' if status == 'Success' else 'failed'
                log.at_message_id = at_id
                log.cost = float(str(cost).replace('KES ', ''))
                log.sent_at = datetime.utcnow()
                db.session.commit()
                
                logger.info(f"SMS sent to {phone}: {status}")
                return {"status": status, "message_id": at_id}
            
        except Exception as e:
            logger.error(f"SMS send failed to {phone}: {str(e)}")
            log.status = 'failed'
            db.session.commit()
            return {"status": "failed", "error": str(e)}

    @classmethod
    def send_bulk_sms(cls, phone_numbers, message, message_type='bulk'):
        results = {"sent": 0, "failed": 0, "errors": []}
        
        # Process in batches of 100
        batch_size = 100
        for i in range(0, len(phone_numbers), batch_size):
            batch = phone_numbers[i:i + batch_size]
            for phone in batch:
                result = cls.send_sms(phone, message, message_type)
                if result.get('status') in ['Success', 'sent', 'dev_mode']:
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append({
                        "phone": phone,
                        "error": result.get('error', 'Unknown')
                    })
        
        return results

    @classmethod
    def send_otp(cls, phone_number, otp_code):
        message = (
            f"Your AgriSync 360 verification code is: {otp_code}\n"
            f"Valid for 10 minutes. Do not share this code.\n"
            f"AgriSync 360"
        )
        return cls.send_sms(phone_number, message, 'otp')

    @classmethod
    def send_weather_alert(cls, farmer, alert_data):
        message = (
            f"AgriSync Alert for {farmer.first_name}:\n"
            f"{alert_data['title']}\n"
            f"{alert_data['message']}\n"
            f"Stay safe. - AgriSync 360"
        )
        return cls.send_sms(
            farmer.user.phone, message, 
            'weather_alert', farmer.id
        )

    @classmethod
    def send_subscription_confirmation(cls, farmer, payment):
        message = (
            f"Hi {farmer.first_name}, payment confirmed!\n"
            f"Plan: {payment.plan.replace('_', ' ').title()}\n"
            f"Amount: KSH {int(payment.amount_ksh)}\n"
            f"Receipt: {payment.mpesa_receipt_number}\n"
            f"Valid until: {payment.subscription_end}\n"
            f"Thank you - AgriSync 360"
        )
        return cls.send_sms(
            farmer.user.phone, message,
            'subscription', farmer.id
        )

    @classmethod
    def send_market_alert(cls, farmer, crop, old_price, new_price, county):
        change_pct = ((new_price - old_price) / old_price) * 100
        direction = "up" if change_pct > 0 else "down"
        message = (
            f"Market Alert - {crop.title()}:\n"
            f"Price in {county} is {direction} "
            f"{abs(change_pct):.0f}%\n"
            f"Current: KSH {new_price:.0f}/kg\n"
            f"AgriSync 360 Market Intelligence"
        )
        return cls.send_sms(
            farmer.user.phone, message,
            'market_alert', farmer.id
        )

    @staticmethod
    def normalize_phone(phone):
        phone = str(phone).strip().replace(' ', '').replace('-', '')
        if phone.startswith('+254'):
            return phone
        elif phone.startswith('254'):
            return '+' + phone
        elif phone.startswith('07') or phone.startswith('01'):
            return '+254' + phone[1:]
        return phone
