"""
AgriSync 360 — Farm Intelligence Models
Planting Calendar, Soil Health, Irrigation, Pest Library
"""
from app.extensions import db
from datetime import datetime, date
import uuid
from sqlalchemy.dialects.postgresql import UUID


class PlantingCalendarEntry(db.Model):
    """Smart planting calendar entries per farmer"""
    __tablename__ = 'planting_calendar'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    crop_name = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100))
    farm_id = db.Column(UUID(as_uuid=True),
                        db.ForeignKey('farm.id'), nullable=True)
    planned_planting_date = db.Column(db.Date, nullable=False)
    actual_planting_date = db.Column(db.Date)
    planned_harvest_date = db.Column(db.Date)
    actual_harvest_date = db.Column(db.Date)
    area_acres = db.Column(db.Float, default=1.0)
    status = db.Column(db.Enum(
        'planned', 'planted', 'growing',
        'harvested', 'failed', 'cancelled',
        name='calendar_status_enum'
    ), default='planned')
    reminder_days_before = db.Column(db.Integer, default=7)
    notes = db.Column(db.Text)
    color = db.Column(db.String(20), default='#2D6A4F')
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='calendar_entries')

    def to_dict(self):
        days_to_plant = None
        if self.planned_planting_date:
            delta = self.planned_planting_date - date.today()
            days_to_plant = delta.days

        return {
            'id': str(self.id),
            'crop_name': self.crop_name,
            'variety': self.variety,
            'farm_id': str(self.farm_id) if self.farm_id else None,
            'planned_planting_date': self.planned_planting_date.isoformat()
                if self.planned_planting_date else None,
            'actual_planting_date': self.actual_planting_date.isoformat()
                if self.actual_planting_date else None,
            'planned_harvest_date': self.planned_harvest_date.isoformat()
                if self.planned_harvest_date else None,
            'actual_harvest_date': self.actual_harvest_date.isoformat()
                if self.actual_harvest_date else None,
            'area_acres': self.area_acres,
            'status': self.status,
            'days_to_plant': days_to_plant,
            'notes': self.notes,
            'color': self.color,
            'created_at': self.created_at.isoformat(),
        }


class SoilHealthRecord(db.Model):
    """Soil test results and health tracking"""
    __tablename__ = 'soil_health_record'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    farm_id = db.Column(UUID(as_uuid=True),
                        db.ForeignKey('farm.id'), nullable=True)
    test_date = db.Column(db.Date, nullable=False,
                          default=date.today)
    lab_name = db.Column(db.String(200))
    ph_level = db.Column(db.Float)
    nitrogen_ppm = db.Column(db.Float)
    phosphorus_ppm = db.Column(db.Float)
    potassium_ppm = db.Column(db.Float)
    organic_matter_percent = db.Column(db.Float)
    calcium_ppm = db.Column(db.Float)
    magnesium_ppm = db.Column(db.Float)
    zinc_ppm = db.Column(db.Float)
    boron_ppm = db.Column(db.Float)
    soil_texture = db.Column(db.Enum(
        'sandy', 'loamy', 'clay', 'silty',
        'sandy_loam', 'clay_loam', 'silt_loam',
        name='soil_texture_enum'
    ))
    water_retention = db.Column(db.Enum(
        'poor', 'moderate', 'good', 'excellent',
        name='water_retention_enum'
    ))
    recommendations = db.Column(db.Text)
    ai_recommendations = db.Column(db.Text)
    next_test_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='soil_records')

    @property
    def ph_status(self):
        if not self.ph_level:
            return 'unknown'
        if self.ph_level < 5.5:
            return 'acidic'
        if self.ph_level > 7.5:
            return 'alkaline'
        return 'optimal'

    def to_dict(self):
        return {
            'id': str(self.id),
            'test_date': self.test_date.isoformat()
                if self.test_date else None,
            'lab_name': self.lab_name,
            'ph_level': self.ph_level,
            'ph_status': self.ph_status,
            'nitrogen_ppm': self.nitrogen_ppm,
            'phosphorus_ppm': self.phosphorus_ppm,
            'potassium_ppm': self.potassium_ppm,
            'organic_matter_percent': self.organic_matter_percent,
            'calcium_ppm': self.calcium_ppm,
            'magnesium_ppm': self.magnesium_ppm,
            'zinc_ppm': self.zinc_ppm,
            'boron_ppm': self.boron_ppm,
            'soil_texture': self.soil_texture,
            'water_retention': self.water_retention,
            'recommendations': self.recommendations,
            'ai_recommendations': self.ai_recommendations,
            'next_test_date': self.next_test_date.isoformat()
                if self.next_test_date else None,
            'created_at': self.created_at.isoformat(),
        }


class IrrigationSchedule(db.Model):
    """Irrigation scheduling and water usage"""
    __tablename__ = 'irrigation_schedule'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    farm_id = db.Column(UUID(as_uuid=True),
                        db.ForeignKey('farm.id'), nullable=True)
    crop_name = db.Column(db.String(100))
    irrigation_type = db.Column(db.Enum(
        'drip', 'sprinkler', 'furrow', 'flood',
        'manual', 'center_pivot',
        name='irrigation_type_enum'
    ), default='drip')
    water_source = db.Column(db.Enum(
        'river', 'borehole', 'dam', 'rainwater',
        'municipal', 'canal',
        name='water_source_irr_enum'
    ))
    scheduled_date = db.Column(db.Date, nullable=False)
    scheduled_time = db.Column(db.String(20))
    duration_minutes = db.Column(db.Integer)
    water_amount_litres = db.Column(db.Float)
    area_irrigated_acres = db.Column(db.Float)
    status = db.Column(db.Enum(
        'scheduled', 'completed', 'skipped', 'postponed',
        name='irrigation_status_enum'
    ), default='scheduled')
    actual_date = db.Column(db.Date)
    rainfall_mm = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    cost_ksh = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='irrigation_schedules')

    def to_dict(self):
        return {
            'id': str(self.id),
            'crop_name': self.crop_name,
            'irrigation_type': self.irrigation_type,
            'water_source': self.water_source,
            'scheduled_date': self.scheduled_date.isoformat()
                if self.scheduled_date else None,
            'scheduled_time': self.scheduled_time,
            'duration_minutes': self.duration_minutes,
            'water_amount_litres': self.water_amount_litres,
            'area_irrigated_acres': self.area_irrigated_acres,
            'status': self.status,
            'actual_date': self.actual_date.isoformat()
                if self.actual_date else None,
            'rainfall_mm': self.rainfall_mm,
            'cost_ksh': self.cost_ksh,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
        }


class PestDiseaseEntry(db.Model):
    """Pest and disease library — searchable database"""
    __tablename__ = 'pest_disease_library'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    local_name = db.Column(db.String(200))
    scientific_name = db.Column(db.String(200))
    type = db.Column(db.Enum(
        'pest', 'disease', 'weed', 'deficiency',
        name='pest_type_enum'
    ), nullable=False)
    affected_crops = db.Column(db.ARRAY(db.String))
    symptoms = db.Column(db.Text)
    spread_method = db.Column(db.Text)
    favorable_conditions = db.Column(db.Text)
    severity = db.Column(db.Enum(
        'low', 'medium', 'high', 'critical',
        name='severity_enum'
    ), default='medium')
    organic_control = db.Column(db.Text)
    chemical_control = db.Column(db.Text)
    kenya_products = db.Column(db.ARRAY(db.String))
    prevention = db.Column(db.Text)
    images = db.Column(db.ARRAY(db.String))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'local_name': self.local_name,
            'scientific_name': self.scientific_name,
            'type': self.type,
            'affected_crops': self.affected_crops or [],
            'symptoms': self.symptoms,
            'spread_method': self.spread_method,
            'favorable_conditions': self.favorable_conditions,
            'severity': self.severity,
            'organic_control': self.organic_control,
            'chemical_control': self.chemical_control,
            'kenya_products': self.kenya_products or [],
            'prevention': self.prevention,
            'images': self.images or [],
            'created_at': self.created_at.isoformat(),
        }
