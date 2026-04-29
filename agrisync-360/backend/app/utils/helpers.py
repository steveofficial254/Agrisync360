import re
from uuid import UUID


def normalize_phone(phone: str) -> str:
    """Normalize any valid Kenyan phone format to +2547XXXXXXXX."""
    phone = (phone or "").strip().replace(" ", "").replace("-", "")
    if phone.startswith("+254") and len(phone) == 13:
        return phone
    if phone.startswith("254") and len(phone) == 12:
        return "+" + phone
    if phone.startswith("0") and len(phone) == 10:
        return "+254" + phone[1:]
    return phone


def is_valid_kenyan_phone(phone: str) -> bool:
    """
    Accept all valid Kenyan mobile formats:
      0712345678   (local, 10 digits)
      +254712345678 (international with +)
      254712345678  (international without +)
    Supports both 07 and 01 prefixes (Safaricom, Airtel, Telkom).
    Regex: ^(?:\+254|254|0)[17]\d{8}$
    """
    return bool(re.match(r"^(?:\+254|254|0)[17]\d{8}$", (phone or "").strip()))


def is_valid_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False
