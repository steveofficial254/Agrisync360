from marshmallow import Schema, fields


class MarketQuerySchema(Schema):
    crop = fields.Str(required=False)
    county = fields.Str(required=False)
    months = fields.Int(required=False)
    acres = fields.Float(required=False)
