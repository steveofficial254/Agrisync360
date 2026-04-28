import base64
import json
from datetime import date, datetime, timedelta

import requests

from app.extensions import db, redis_client
from app.models.payment import Payment
from app.models.user import User
from app.models.farmer import Farmer
from app.services.sms_service import SMSService
from app.utils.helpers import normalize_phone


class MpesaService:
    @staticmethod
    def _base_url():
        from flask import current_app

        env = current_app.config.get("MPESA_ENVIRONMENT", "sandbox")
        return "https://sandbox.safaricom.co.ke" if env == "sandbox" else "https://api.safaricom.co.ke"

    @staticmethod
    def get_access_token():
        cached = redis_client.get("mpesa:token")
        if cached:
            return cached

        from flask import current_app

        creds = f"{current_app.config.get('MPESA_CONSUMER_KEY')}:{current_app.config.get('MPESA_CONSUMER_SECRET')}"
        auth = base64.b64encode(creds.encode()).decode()
        res = requests.get(
            f"{MpesaService._base_url()}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {auth}"},
            timeout=15,
        )
        res.raise_for_status()
        token = res.json().get("access_token")
        redis_client.setex("mpesa:token", 3300, token)
        return token

    @staticmethod
    def generate_password():
        from flask import current_app

        ts = datetime.now().strftime("%Y%m%d%H%M%S")
        raw = f"{current_app.config.get('MPESA_BUSINESS_SHORT_CODE')}{current_app.config.get('MPESA_PASSKEY')}{ts}"
        return base64.b64encode(raw.encode()).decode(), ts

    @staticmethod
    def stk_push(phone_number, amount, account_ref, description):
        from flask import current_app

        phone = normalize_phone(phone_number).replace("+", "")
        token = MpesaService.get_access_token()
        password, timestamp = MpesaService.generate_password()
        payload = {
            "BusinessShortCode": current_app.config.get("MPESA_BUSINESS_SHORT_CODE"),
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(float(amount)),
            "PartyA": phone,
            "PartyB": current_app.config.get("MPESA_BUSINESS_SHORT_CODE"),
            "PhoneNumber": phone,
            "CallBackURL": current_app.config.get("MPESA_CALLBACK_URL"),
            "AccountReference": account_ref,
            "TransactionDesc": description,
        }
        res = requests.post(
            f"{MpesaService._base_url()}/mpesa/stkpush/v1/processrequest",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=20,
        )
        res.raise_for_status()
        data = res.json()
        return data

    @staticmethod
    def verify_payment(checkout_request_id):
        from flask import current_app

        token = MpesaService.get_access_token()
        password, timestamp = MpesaService.generate_password()
        payload = {
            "BusinessShortCode": current_app.config.get("MPESA_BUSINESS_SHORT_CODE"),
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id,
        }
        res = requests.post(
            f"{MpesaService._base_url()}/mpesa/stkpushquery/v1/query",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=20,
        )
        res.raise_for_status()
        return res.json()

    @staticmethod
    def handle_callback(callback_data):
        stk = callback_data.get("Body", {}).get("stkCallback", {})
        checkout_request_id = stk.get("CheckoutRequestID")
        result_code = stk.get("ResultCode")
        payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()
        if not payment:
            return False

        if result_code == 0:
            item_map = {i.get("Name"): i.get("Value") for i in stk.get("CallbackMetadata", {}).get("Item", [])}
            payment.status = "completed"
            payment.mpesa_receipt_number = item_map.get("MpesaReceiptNumber")
            payment.mpesa_reference = payment.mpesa_receipt_number
            payment.payment_date = datetime.now()
            payment.subscription_start = date.today()
            payment.subscription_end = date.today() + timedelta(days=30)
            farmer = payment.farmer
            if farmer:
                SMSService().send_subscription_confirmation(farmer, payment)
        else:
            payment.status = "failed"

        db.session.commit()
        return True
