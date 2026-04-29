import requests
import base64
import json
import os
from datetime import datetime
from app.extensions import redis_client, db
from app.models.payment import Payment
import logging

logger = logging.getLogger(__name__)

SANDBOX_BASE = "https://sandbox.safaricom.co.ke"
PROD_BASE = "https://api.safaricom.co.ke"

class MpesaService:

    @staticmethod
    def get_base_url():
        env = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
        return SANDBOX_BASE if env == 'sandbox' else PROD_BASE

    @staticmethod  
    def normalize_phone(phone):
        # Convert any format to 2547XXXXXXXX
        phone = str(phone).strip().replace(' ', '').replace('-', '')
        if phone.startswith('+254'):
            return phone[1:]  # remove +
        elif phone.startswith('254'):
            return phone
        elif phone.startswith('07') or phone.startswith('01'):
            return '254' + phone[1:]
        return phone

    @staticmethod
    def get_access_token():
        # Check Redis cache first
        cached = redis_client.get('mpesa_token')
        if cached:
            return cached.decode('utf-8')
        
        consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        
        if not consumer_key or not consumer_secret:
            raise ValueError("M-Pesa credentials not configured")
        
        credentials = base64.b64encode(
            f"{consumer_key}:{consumer_secret}".encode()
        ).decode('utf-8')
        
        url = f"{MpesaService.get_base_url()}/oauth/v1/generate"
        params = {"grant_type": "client_credentials"}
        headers = {"Authorization": f"Basic {credentials}"}
        
        response = requests.get(url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        
        token = response.json().get('access_token')
        # Cache for 55 minutes (token expires in 60)
        redis_client.setex('mpesa_token', 3300, token)
        return token

    @staticmethod
    def generate_password():
        shortcode = os.getenv('MPESA_BUSINESS_SHORT_CODE', '174379')
        passkey = os.getenv('MPESA_PASSKEY', '')
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        raw = f"{shortcode}{passkey}{timestamp}"
        password = base64.b64encode(raw.encode()).decode('utf-8')
        return password, timestamp

    @staticmethod
    def stk_push(phone_number, amount, account_ref, description, farmer_id, plan):
        try:
            phone = MpesaService.normalize_phone(phone_number)
            token = MpesaService.get_access_token()
            password, timestamp = MpesaService.generate_password()
            shortcode = os.getenv('MPESA_BUSINESS_SHORT_CODE', '174379')
            callback_url = os.getenv('MPESA_CALLBACK_URL')
            
            payload = {
                "BusinessShortCode": shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),
                "PartyA": phone,
                "PartyB": shortcode,
                "PhoneNumber": phone,
                "CallBackURL": callback_url,
                "AccountReference": account_ref,
                "TransactionDesc": description
            }
            
            url = f"{MpesaService.get_base_url()}/mpesa/stkpush/v1/processrequest"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                url, json=payload, headers=headers, timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            # Save pending payment to database
            payment = Payment(
                farmer_id=farmer_id,
                plan=plan,
                amount_ksh=amount,
                phone_number=phone,
                checkout_request_id=result.get('CheckoutRequestID'),
                merchant_request_id=result.get('MerchantRequestID'),
                status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            
            logger.info(f"STK Push sent to {phone} for KSH {amount}")
            return {
                "checkout_request_id": result.get('CheckoutRequestID'),
                "merchant_request_id": result.get('MerchantRequestID'),
                "response_code": result.get('ResponseCode'),
                "customer_message": result.get('CustomerMessage')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"M-Pesa STK Push failed: {str(e)}")
            raise Exception(f"Payment initiation failed: {str(e)}")

    @staticmethod
    def handle_callback(callback_data):
        try:
            body = callback_data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            
            result_code = stk_callback.get('ResultCode')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            
            payment = Payment.query.filter_by(
                checkout_request_id=checkout_request_id
            ).first()
            
            if not payment:
                logger.warning(f"Payment not found: {checkout_request_id}")
                return False
            
            if result_code == 0:
                # Payment successful
                metadata = stk_callback.get('CallbackMetadata', {})
                items = metadata.get('Item', [])
                
                receipt = next(
                    (i['Value'] for i in items if i['Name'] == 'MpesaReceiptNumber'),
                    None
                )
                amount = next(
                    (i['Value'] for i in items if i['Name'] == 'Amount'),
                    None
                )
                
                payment.status = 'completed'
                payment.mpesa_receipt_number = receipt
                payment.payment_date = datetime.utcnow()
                
                # Set subscription dates based on plan
                from datetime import timedelta, date
                today = date.today()
                payment.subscription_start = today
                
                plan_durations = {
                    'basic_monthly': 30,
                    'pro_monthly': 30,
                    'basic_annual': 365,
                    'pro_annual': 365,
                    'ngo_annual': 365,
                    'county_annual': 365
                }
                days = plan_durations.get(payment.plan, 30)
                payment.subscription_end = today + timedelta(days=days)
                
                db.session.commit()
                
                # Send confirmation SMS
                try:
                    from app.services.sms_service import SMSService
                    SMSService.send_subscription_confirmation(
                        payment.farmer, payment
                    )
                except Exception as sms_error:
                    logger.warning(f"Confirmation SMS failed: {sms_error}")
                
                logger.info(f"Payment confirmed: {receipt}")
                return True
                
            else:
                # Payment failed or cancelled
                payment.status = 'failed'
                db.session.commit()
                logger.info(f"Payment failed/cancelled: {checkout_request_id}")
                return False
                
        except Exception as e:
            logger.error(f"Callback processing error: {str(e)}")
            db.session.rollback()
            return False

    @staticmethod
    def check_subscription_status(farmer_id):
        from datetime import date
        today = date.today()
        
        active_payment = Payment.query.filter_by(
            farmer_id=farmer_id,
            status='completed'
        ).filter(
            Payment.subscription_end >= today
        ).order_by(Payment.subscription_end.desc()).first()
        
        if active_payment:
            return {
                "is_active": True,
                "plan": active_payment.plan,
                "expires_on": active_payment.subscription_end.isoformat(),
                "days_remaining": (active_payment.subscription_end - today).days
            }
        
        return {
            "is_active": False,
            "plan": None,
            "expires_on": None,
            "days_remaining": 0
        }
