import re
from uuid import UUID


def normalize_phone(phone: str) -> str:
    phone = (phone or "").strip().replace(" ", "")
    if phone.startswith("07") and len(phone) == 10:
        return "+254" + phone[1:]
    if phone.startswith("254") and len(phone) == 12:
        return "+" + phone
    return phone


def is_valid_kenyan_phone(phone: str) -> bool:
    return bool(re.match(r"^(\+254|254|07)7\d{8}$", (phone or "").strip()))


def is_valid_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False
