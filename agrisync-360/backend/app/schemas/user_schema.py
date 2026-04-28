from marshmallow import Schema, fields, validate

from app.utils.validators import validate_phone


class RegisterSchema(Schema):
    phone = fields.Str(required=True, validate=validate_phone)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    role = fields.Str(load_default="farmer")


class LoginSchema(Schema):
    phone = fields.Str(required=True, validate=validate_phone)
    password = fields.Str(required=True)


class OTPVerifySchema(Schema):
    phone = fields.Str(required=True, validate=validate_phone)
    otp_code = fields.Str(required=True, validate=validate.Length(equal=6))
