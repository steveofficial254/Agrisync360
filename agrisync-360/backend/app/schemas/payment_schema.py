from marshmallow import Schema, fields


class SubscribeSchema(Schema):
    plan = fields.Str(required=True)
    amount_ksh = fields.Float(required=True)
    phone_number = fields.Str(required=True)
