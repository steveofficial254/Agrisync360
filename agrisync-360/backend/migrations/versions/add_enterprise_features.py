"""Add enterprise feature models

Revision ID: enterprise_001
Revises: new_features_001
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enterprise_001'
down_revision = 'new_features_001'
branch_labels = None
depends_on = None


def upgrade():
    # Planting Calendar
    op.create_table(
        'planting_calendar',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('crop_name', sa.String(100), nullable=False),
        sa.Column('variety', sa.String(100)),
        sa.Column('farm_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farms.id')),
        sa.Column('planned_planting_date', sa.Date, nullable=False),
        sa.Column('actual_planting_date', sa.Date),
        sa.Column('planned_harvest_date', sa.Date),
        sa.Column('actual_harvest_date', sa.Date),
        sa.Column('area_acres', sa.Float, default=1.0),
        sa.Column('status', sa.Enum('planned', 'planted', 'growing', 'harvested', 'failed', 'cancelled', name='calendar_status_enum'), default='planned'),
        sa.Column('reminder_days_before', sa.Integer, default=7),
        sa.Column('notes', sa.Text),
        sa.Column('color', sa.String(20), default='#2D6A4F'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Soil Health
    op.create_table(
        'soil_health_record',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('farm_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farms.id')),
        sa.Column('test_date', sa.Date, nullable=False, server_default=sa.func.current_date()),
        sa.Column('lab_name', sa.String(200)),
        sa.Column('ph_level', sa.Float),
        sa.Column('nitrogen_ppm', sa.Float),
        sa.Column('phosphorus_ppm', sa.Float),
        sa.Column('potassium_ppm', sa.Float),
        sa.Column('organic_matter_percent', sa.Float),
        sa.Column('calcium_ppm', sa.Float),
        sa.Column('magnesium_ppm', sa.Float),
        sa.Column('zinc_ppm', sa.Float),
        sa.Column('boron_ppm', sa.Float),
        sa.Column('soil_texture', sa.Enum('sandy', 'loamy', 'clay', 'silty', 'sandy_loam', 'clay_loam', 'silt_loam', name='soil_texture_enum')),
        sa.Column('water_retention', sa.Enum('poor', 'moderate', 'good', 'excellent', name='water_retention_enum')),
        sa.Column('recommendations', sa.Text),
        sa.Column('ai_recommendations', sa.Text),
        sa.Column('next_test_date', sa.Date),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Irrigation
    op.create_table(
        'irrigation_schedule',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('farm_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farms.id')),
        sa.Column('crop_name', sa.String(100)),
        sa.Column('irrigation_type', sa.Enum('drip', 'sprinkler', 'furrow', 'flood', 'manual', 'center_pivot', name='irrigation_type_enum'), default='drip'),
        sa.Column('water_source', sa.Enum('river', 'borehole', 'dam', 'rainwater', 'municipal', 'canal', name='water_source_irr_enum')),
        sa.Column('scheduled_date', sa.Date, nullable=False),
        sa.Column('scheduled_time', sa.String(20)),
        sa.Column('duration_minutes', sa.Integer),
        sa.Column('water_amount_litres', sa.Float),
        sa.Column('area_irrigated_acres', sa.Float),
        sa.Column('status', sa.Enum('scheduled', 'completed', 'skipped', 'postponed', name='irrigation_status_enum'), default='scheduled'),
        sa.Column('actual_date', sa.Date),
        sa.Column('rainfall_mm', sa.Float, default=0),
        sa.Column('notes', sa.Text),
        sa.Column('cost_ksh', sa.Float, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Pest Library
    op.create_table(
        'pest_disease_library',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('local_name', sa.String(200)),
        sa.Column('scientific_name', sa.String(200)),
        sa.Column('type', sa.Enum('pest', 'disease', 'weed', 'deficiency', name='pest_type_enum'), nullable=False),
        sa.Column('affected_crops', postgresql.ARRAY(sa.String)),
        sa.Column('symptoms', sa.Text),
        sa.Column('spread_method', sa.Text),
        sa.Column('favorable_conditions', sa.Text),
        sa.Column('severity', sa.Enum('low', 'medium', 'high', 'critical', name='severity_enum'), default='medium'),
        sa.Column('organic_control', sa.Text),
        sa.Column('chemical_control', sa.Text),
        sa.Column('kenya_products', postgresql.ARRAY(sa.String)),
        sa.Column('prevention', sa.Text),
        sa.Column('images', postgresql.ARRAY(sa.String)),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Financial Transactions
    op.create_table(
        'financial_transaction',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('transaction_type', sa.Enum('income', 'expense', name='transaction_type_enum'), nullable=False),
        sa.Column('category', sa.Enum('crop_sale', 'livestock_sale', 'subsidy', 'grant', 'other_income', 'seeds', 'fertilizer', 'pesticide', 'labor', 'irrigation', 'transport', 'equipment', 'land_rent', 'loan_repayment', 'insurance', 'other_expense', name='transaction_category_enum'), nullable=False),
        sa.Column('description', sa.String(300)),
        sa.Column('amount_ksh', sa.Float, nullable=False),
        sa.Column('transaction_date', sa.Date, nullable=False, server_default=sa.func.current_date()),
        sa.Column('crop_name', sa.String(100)),
        sa.Column('season', sa.String(100)),
        sa.Column('payment_method', sa.Enum('cash', 'mpesa', 'bank', 'cheque', 'other', name='payment_method_enum'), default='cash'),
        sa.Column('reference_number', sa.String(200)),
        sa.Column('receipt_url', sa.String(500)),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Loans
    op.create_table(
        'loan_record',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('lender_name', sa.String(200), nullable=False),
        sa.Column('lender_type', sa.Enum('bank', 'sacco', 'mfi', 'agra', 'government', 'cooperative', 'family', 'other', name='lender_type_enum')),
        sa.Column('loan_purpose', sa.String(300)),
        sa.Column('principal_ksh', sa.Float, nullable=False),
        sa.Column('interest_rate_percent', sa.Float),
        sa.Column('disbursement_date', sa.Date),
        sa.Column('due_date', sa.Date),
        sa.Column('repayment_frequency', sa.Enum('weekly', 'monthly', 'quarterly', 'harvest_based', 'annual', name='repayment_freq_enum')),
        sa.Column('amount_repaid_ksh', sa.Float, default=0),
        sa.Column('status', sa.Enum('active', 'fully_paid', 'overdue', 'defaulted', name='loan_status_enum'), default='active'),
        sa.Column('collateral', sa.Text),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Insurance
    op.create_table(
        'insurance_policy',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('provider_name', sa.String(200), nullable=False),
        sa.Column('policy_number', sa.String(200)),
        sa.Column('insurance_type', sa.Enum('crop', 'livestock', 'equipment', 'comprehensive', 'weather_index', 'area_yield_index', name='insurance_type_enum')),
        sa.Column('covered_crops', postgresql.ARRAY(sa.String)),
        sa.Column('coverage_amount_ksh', sa.Float),
        sa.Column('premium_ksh', sa.Float),
        sa.Column('premium_frequency', sa.Enum('monthly', 'quarterly', 'annual', 'per_season', name='premium_freq_enum')),
        sa.Column('start_date', sa.Date),
        sa.Column('end_date', sa.Date),
        sa.Column('status', sa.Enum('active', 'expired', 'claimed', 'cancelled', name='insurance_status_enum'), default='active'),
        sa.Column('claim_amount_ksh', sa.Float),
        sa.Column('claim_date', sa.Date),
        sa.Column('claim_status', sa.String(100)),
        sa.Column('notes', sa.Text),
        sa.Column('document_url', sa.String(500)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Season Budget
    op.create_table(
        'season_budget',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('season_name', sa.String(100), nullable=False),
        sa.Column('crop_name', sa.String(100)),
        sa.Column('area_acres', sa.Float, default=1.0),
        sa.Column('start_date', sa.Date),
        sa.Column('end_date', sa.Date),
        sa.Column('planned_seed_ksh', sa.Float, default=0),
        sa.Column('planned_fertilizer_ksh', sa.Float, default=0),
        sa.Column('planned_pesticide_ksh', sa.Float, default=0),
        sa.Column('planned_labor_ksh', sa.Float, default=0),
        sa.Column('planned_irrigation_ksh', sa.Float, default=0),
        sa.Column('planned_transport_ksh', sa.Float, default=0),
        sa.Column('planned_other_ksh', sa.Float, default=0),
        sa.Column('expected_yield_kg', sa.Float),
        sa.Column('expected_price_per_kg', sa.Float),
        sa.Column('expected_revenue_ksh', sa.Float),
        sa.Column('actual_total_cost_ksh', sa.Float, default=0),
        sa.Column('actual_revenue_ksh', sa.Float, default=0),
        sa.Column('status', sa.Enum('planning', 'active', 'completed', name='budget_status_enum'), default='planning'),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Price Alerts
    op.create_table(
        'price_alert',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farmer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('farmers.id')),
        sa.Column('crop_name', sa.String(100), nullable=False),
        sa.Column('target_price_ksh', sa.Float, nullable=False),
        sa.Column('condition', sa.Enum('above', 'below', 'equals', name='alert_condition_enum'), default='above'),
        sa.Column('county', sa.String(100)),
        sa.Column('notify_via', postgresql.ARRAY(sa.String), default=['sms']),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('triggered_count', sa.Integer, default=0),
        sa.Column('last_triggered', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Buyer Directory
    op.create_table(
        'buyer_directory',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('business_name', sa.String(300), nullable=False),
        sa.Column('contact_name', sa.String(200)),
        sa.Column('phone', sa.String(20)),
        sa.Column('email', sa.String(200)),
        sa.Column('buyer_type', sa.Enum('trader', 'exporter', 'processor', 'retailer', 'hotel', 'school', 'ngo', 'government', name='buyer_type_enum')),
        sa.Column('crops_wanted', postgresql.ARRAY(sa.String)),
        sa.Column('counties_served', postgresql.ARRAY(sa.String)),
        sa.Column('minimum_quantity_kg', sa.Float),
        sa.Column('quality_requirements', sa.Text),
        sa.Column('payment_terms', sa.Text),
        sa.Column('certifications_required', postgresql.ARRAY(sa.String)),
        sa.Column('is_verified', sa.Boolean, default=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('buyer_directory')
    op.drop_table('price_alert')
    op.drop_table('season_budget')
    op.drop_table('insurance_policy')
    op.drop_table('loan_record')
    op.drop_table('financial_transaction')
    op.drop_table('pest_disease_library')
    op.drop_table('irrigation_schedule')
    op.drop_table('soil_health_record')
    op.drop_table('planting_calendar')
