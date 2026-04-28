from marshmallow import Schema, fields


class WeatherQuerySchema(Schema):
    lat = fields.Float(required=False)
    lon = fields.Float(required=False)
    crop = fields.Str(required=False)
