"""
AgriSync 360 — Financial Management Models
P&L, Loans, Insurance, Budget
"""
from app.extensions import db
from datetime import datetime, date
import uuid
from sqlalchemy.dialects.postgresql import UUID


class FinancialTransaction(db.Model):
    """Farm income and expense tracking for P&L"""
    __tablename__ = 'financial_transaction'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    transaction_type = db.Column(db.Enum(
        'income', 'expense', name='transaction_type_enum'
    ), nullable=False)
    category = db.Column(db.Enum(
        # Income categories
        'crop_sale', 'livestock_sale', 'subsidy',
        'grant', 'other_income',
        # Expense categories
        'seeds', 'fertilizer', 'pesticide', 'labor',
        'irrigation', 'transport', 'equipment',
        'land_rent', 'loan_repayment', 'insurance',
        'other_expense',
        name='transaction_category_enum'
    ), nullable=False)
    description = db.Column(db.String(300))
    amount_ksh = db.Column(db.Float, nullable=False)
    transaction_date = db.Column(db.Date, nullable=False,
                                 default=date.today)
    crop_name = db.Column(db.String(100))
    season = db.Column(db.String(100))
    payment_method = db.Column(db.Enum(
        'cash', 'mpesa', 'bank', 'cheque', 'other',
        name='payment_method_enum'
    ), default='cash')
    reference_number = db.Column(db.String(200))
    receipt_url = db.Column(db.String(500))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='transactions')

    def to_dict(self):
        return {
            'id': str(self.id),
            'transaction_type': self.transaction_type,
            'category': self.category,
            'description': self.description,
            'amount_ksh': self.amount_ksh,
            'transaction_date': self.transaction_date.isoformat()
                if self.transaction_date else None,
            'crop_name': self.crop_name,
            'season': self.season,
            'payment_method': self.payment_method,
            'reference_number': self.reference_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
        }


class LoanRecord(db.Model):
    """Farm loans and credit tracking"""
    __tablename__ = 'loan_record'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    lender_name = db.Column(db.String(200), nullable=False)
    lender_type = db.Column(db.Enum(
        'bank', 'sacco', 'mfi', 'agra', 'government',
        'cooperative', 'family', 'other',
        name='lender_type_enum'
    ))
    loan_purpose = db.Column(db.String(300))
    principal_ksh = db.Column(db.Float, nullable=False)
    interest_rate_percent = db.Column(db.Float)
    disbursement_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    repayment_frequency = db.Column(db.Enum(
        'weekly', 'monthly', 'quarterly',
        'harvest_based', 'annual',
        name='repayment_freq_enum'
    ))
    amount_repaid_ksh = db.Column(db.Float, default=0)
    status = db.Column(db.Enum(
        'active', 'fully_paid', 'overdue', 'defaulted',
        name='loan_status_enum'
    ), default='active')
    collateral = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='loans')

    @property
    def outstanding_ksh(self):
        return max(0, self.principal_ksh -
                   (self.amount_repaid_ksh or 0))

    @property
    def repayment_percent(self):
        if self.principal_ksh > 0:
            return min(100, ((self.amount_repaid_ksh or 0) /
                             self.principal_ksh) * 100)
        return 0

    @property
    def is_overdue(self):
        if self.due_date and self.status == 'active':
            return date.today() > self.due_date
        return False

    def to_dict(self):
        return {
            'id': str(self.id),
            'lender_name': self.lender_name,
            'lender_type': self.lender_type,
            'loan_purpose': self.loan_purpose,
            'principal_ksh': self.principal_ksh,
            'interest_rate_percent': self.interest_rate_percent,
            'disbursement_date': self.disbursement_date.isoformat()
                if self.disbursement_date else None,
            'due_date': self.due_date.isoformat()
                if self.due_date else None,
            'repayment_frequency': self.repayment_frequency,
            'amount_repaid_ksh': self.amount_repaid_ksh,
            'outstanding_ksh': self.outstanding_ksh,
            'repayment_percent': self.repayment_percent,
            'status': self.status,
            'is_overdue': self.is_overdue,
            'collateral': self.collateral,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
        }


class InsurancePolicy(db.Model):
    """Crop and farm insurance policies"""
    __tablename__ = 'insurance_policy'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    provider_name = db.Column(db.String(200), nullable=False)
    policy_number = db.Column(db.String(200))
    insurance_type = db.Column(db.Enum(
        'crop', 'livestock', 'equipment', 'comprehensive',
        'weather_index', 'area_yield_index',
        name='insurance_type_enum'
    ))
    covered_crops = db.Column(db.ARRAY(db.String))
    coverage_amount_ksh = db.Column(db.Float)
    premium_ksh = db.Column(db.Float)
    premium_frequency = db.Column(db.Enum(
        'monthly', 'quarterly', 'annual', 'per_season',
        name='premium_freq_enum'
    ))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.Enum(
        'active', 'expired', 'claimed', 'cancelled',
        name='insurance_status_enum'
    ), default='active')
    claim_amount_ksh = db.Column(db.Float)
    claim_date = db.Column(db.Date)
    claim_status = db.Column(db.String(100))
    notes = db.Column(db.Text)
    document_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='insurance_policies')

    @property
    def days_to_expiry(self):
        if self.end_date:
            return (self.end_date - date.today()).days
        return None

    def to_dict(self):
        return {
            'id': str(self.id),
            'provider_name': self.provider_name,
            'policy_number': self.policy_number,
            'insurance_type': self.insurance_type,
            'covered_crops': self.covered_crops or [],
            'coverage_amount_ksh': self.coverage_amount_ksh,
            'premium_ksh': self.premium_ksh,
            'premium_frequency': self.premium_frequency,
            'start_date': self.start_date.isoformat()
                if self.start_date else None,
            'end_date': self.end_date.isoformat()
                if self.end_date else None,
            'days_to_expiry': self.days_to_expiry,
            'status': self.status,
            'claim_amount_ksh': self.claim_amount_ksh,
            'claim_status': self.claim_status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
        }


class SeasonBudget(db.Model):
    """Season budget planning"""
    __tablename__ = 'season_budget'

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   default=uuid.uuid4)
    farmer_id = db.Column(UUID(as_uuid=True),
                          db.ForeignKey('farmers.id'))
    season_name = db.Column(db.String(100), nullable=False)
    crop_name = db.Column(db.String(100))
    area_acres = db.Column(db.Float, default=1.0)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    # Planned costs
    planned_seed_ksh = db.Column(db.Float, default=0)
    planned_fertilizer_ksh = db.Column(db.Float, default=0)
    planned_pesticide_ksh = db.Column(db.Float, default=0)
    planned_labor_ksh = db.Column(db.Float, default=0)
    planned_irrigation_ksh = db.Column(db.Float, default=0)
    planned_transport_ksh = db.Column(db.Float, default=0)
    planned_other_ksh = db.Column(db.Float, default=0)
    # Planned revenue
    expected_yield_kg = db.Column(db.Float)
    expected_price_per_kg = db.Column(db.Float)
    expected_revenue_ksh = db.Column(db.Float)
    # Actuals (filled as season progresses)
    actual_total_cost_ksh = db.Column(db.Float, default=0)
    actual_revenue_ksh = db.Column(db.Float, default=0)
    status = db.Column(db.Enum(
        'planning', 'active', 'completed',
        name='budget_status_enum'
    ), default='planning')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True),
                           default=datetime.utcnow)

    farmer = db.relationship('Farmer',
                              backref='budgets')

    @property
    def planned_total_cost(self):
        return (
            (self.planned_seed_ksh or 0) +
            (self.planned_fertilizer_ksh or 0) +
            (self.planned_pesticide_ksh or 0) +
            (self.planned_labor_ksh or 0) +
            (self.planned_irrigation_ksh or 0) +
            (self.planned_transport_ksh or 0) +
            (self.planned_other_ksh or 0)
        )

    @property
    def planned_profit(self):
        return (self.expected_revenue_ksh or 0) - self.planned_total_cost

    def to_dict(self):
        return {
            'id': str(self.id),
            'season_name': self.season_name,
            'crop_name': self.crop_name,
            'area_acres': self.area_acres,
            'start_date': self.start_date.isoformat()
                if self.start_date else None,
            'end_date': self.end_date.isoformat()
                if self.end_date else None,
            'planned_seed_ksh': self.planned_seed_ksh,
            'planned_fertilizer_ksh': self.planned_fertilizer_ksh,
            'planned_pesticide_ksh': self.planned_pesticide_ksh,
            'planned_labor_ksh': self.planned_labor_ksh,
            'planned_irrigation_ksh': self.planned_irrigation_ksh,
            'planned_transport_ksh': self.planned_transport_ksh,
            'planned_other_ksh': self.planned_other_ksh,
            'planned_total_cost': self.planned_total_cost,
            'expected_yield_kg': self.expected_yield_kg,
            'expected_price_per_kg': self.expected_price_per_kg,
            'expected_revenue_ksh': self.expected_revenue_ksh,
            'planned_profit': self.planned_profit,
            'actual_total_cost_ksh': self.actual_total_cost_ksh,
            'actual_revenue_ksh': self.actual_revenue_ksh,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
        }
