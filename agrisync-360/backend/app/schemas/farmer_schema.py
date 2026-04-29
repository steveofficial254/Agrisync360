from marshmallow import Schema, fields, validate


class FarmerCreateSchema(Schema):
    first_name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    last_name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    county = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    sub_county = fields.Str(load_default=None, validate=validate.Length(max=100))
    ward = fields.Str(load_default=None, validate=validate.Length(max=100))
    village = fields.Str(load_default=None, validate=validate.Length(max=120))
    national_id = fields.Str(load_default=None, validate=validate.Length(max=20))
    profile_photo = fields.Str(load_default=None, validate=validate.Length(max=500))


class FarmerProfileSchema(Schema):
    id = fields.Str(dump_only=True)
    user_id = fields.Str(dump_only=True)
    first_name = fields.Str()
    last_name = fields.Str()
    county = fields.Str()
    sub_county = fields.Str()
    ward = fields.Str()
    village = fields.Str()
    national_id = fields.Str()
    profile_photo = fields.Str()
