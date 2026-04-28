from marshmallow import Schema, fields


class FarmerSchema(Schema):
    id = fields.Str(dump_only=True)
    first_name = fields.Str()
    last_name = fields.Str()
    county = fields.Str()
    sub_county = fields.Str()
    ward = fields.Str()
    village = fields.Str()
