from marshmallow import ValidationError

from app.utils.helpers import is_valid_kenyan_phone


def validate_phone(value: str) -> None:
    if not is_valid_kenyan_phone(value):
        raise ValidationError("Invalid phone number format")
