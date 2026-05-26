"""
AgriSync 360 — Financial Management Routes
P&L, Loans, Insurance, Budget
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.financial import (
    FinancialTransaction, LoanRecord,
    InsurancePolicy, SeasonBudget
)
from app.models.farmer import Farmer
from datetime import date
from sqlalchemy import extract
import logging

logger = logging.getLogger(__name__)
financial_bp = Blueprint('financial', __name__, url_prefix='/api/financial')


def get_farmer(user_id):
    return Farmer.query.filter_by(user_id=user_id).first()


# ── PROFIT & LOSS ──────────────────────────────────────────

@financial_bp.route('/transactions', methods=['GET'])
@jwt_required()
def list_transactions():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": {"transactions": []}}), 200

    tx_type = request.args.get('type')
    category = request.args.get('category')
    season = request.args.get('season')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = FinancialTransaction.query.filter_by(
        farmer_id=farmer.id
    )

    if tx_type:
        query = query.filter_by(transaction_type=tx_type)
    if category:
        query = query.filter_by(category=category)
    if season:
        query = query.filter_by(season=season)
    if from_date:
        query = query.filter(
            FinancialTransaction.transaction_date >= from_date
        )
    if to_date:
        query = query.filter(
            FinancialTransaction.transaction_date <= to_date
        )

    transactions = query.order_by(
        FinancialTransaction.transaction_date.desc()
    ).all()

    # P&L Summary
    total_income = sum(
        t.amount_ksh for t in transactions
        if t.transaction_type == 'income'
    )
    total_expenses = sum(
        t.amount_ksh for t in transactions
        if t.transaction_type == 'expense'
    )
    net_profit = total_income - total_expenses

    # By category breakdown
    expense_by_category = {}
    income_by_category = {}
    for t in transactions:
        if t.transaction_type == 'expense':
            expense_by_category[t.category] = \
                expense_by_category.get(t.category, 0) + t.amount_ksh
        else:
            income_by_category[t.category] = \
                income_by_category.get(t.category, 0) + t.amount_ksh

    return jsonify({
        "success": True,
        "data": {
            "transactions": [t.to_dict() for t in transactions],
            "summary": {
                "total_income_ksh": total_income,
                "total_expenses_ksh": total_expenses,
                "net_profit_ksh": net_profit,
                "profit_margin_percent": (
                    (net_profit / total_income * 100)
                    if total_income > 0 else 0
                ),
                "expense_by_category": expense_by_category,
                "income_by_category": income_by_category,
                "total_transactions": len(transactions),
            }
        }
    }), 200


@financial_bp.route('/transactions', methods=['POST'])
@jwt_required()
def add_transaction():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({
            "success": False,
            "message": "Profile required"
        }), 400

    data = request.get_json()

    if not data.get('transaction_type') or not data.get('amount_ksh'):
        return jsonify({
            "success": False,
            "message": "transaction_type and amount_ksh required"
        }), 400

    tx = FinancialTransaction(
        farmer_id=farmer.id,
        transaction_type=data['transaction_type'],
        category=data.get('category', 'other_expense'
                  if data['transaction_type'] == 'expense'
                  else 'other_income'),
        description=data.get('description'),
        amount_ksh=float(data['amount_ksh']),
        transaction_date=data.get('transaction_date',
                                  date.today().isoformat()),
        crop_name=data.get('crop_name'),
        season=data.get('season'),
        payment_method=data.get('payment_method', 'cash'),
        reference_number=data.get('reference_number'),
        notes=data.get('notes'),
    )

    db.session.add(tx)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": tx.to_dict(),
        "message": "Transaction recorded"
    }), 201


@financial_bp.route('/pl-report', methods=['GET'])
@jwt_required()
def profit_loss_report():
    """Detailed P&L report"""
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": {}}), 200

    year = request.args.get('year', date.today().year)

    transactions = FinancialTransaction.query.filter_by(
        farmer_id=farmer.id
    ).filter(
        extract('year', FinancialTransaction.transaction_date) == year
    ).all()

    # Monthly breakdown
    monthly = {}
    for t in transactions:
        month = t.transaction_date.strftime('%Y-%m') \
            if t.transaction_date else 'unknown'
        if month not in monthly:
            monthly[month] = {'income': 0, 'expenses': 0}
        if t.transaction_type == 'income':
            monthly[month]['income'] += t.amount_ksh
        else:
            monthly[month]['expenses'] += t.amount_ksh

    monthly_data = [
        {
            'month': k,
            'income': v['income'],
            'expenses': v['expenses'],
            'profit': v['income'] - v['expenses']
        }
        for k, v in sorted(monthly.items())
    ]

    total_income = sum(v['income'] for v in monthly.values())
    total_expenses = sum(v['expenses'] for v in monthly.values())

    return jsonify({
        "success": True,
        "data": {
            "year": year,
            "monthly": monthly_data,
            "total_income_ksh": total_income,
            "total_expenses_ksh": total_expenses,
            "net_profit_ksh": total_income - total_expenses,
        }
    }), 200


@financial_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def financial_dashboard():
    """Quick dashboard summary"""
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": {}}), 200

    # This month's transactions
    this_month = date.today().replace(day=1)
    transactions = FinancialTransaction.query.filter_by(
        farmer_id=farmer.id
    ).filter(
        FinancialTransaction.transaction_date >= this_month
    ).all()

    income_ksh = sum(t.amount_ksh for t in transactions if t.transaction_type == 'income')
    expenses_ksh = sum(t.amount_ksh for t in transactions if t.transaction_type == 'expense')

    # Active loans
    loans = LoanRecord.query.filter_by(
        farmer_id=farmer.id, status='active'
    ).all()
    total_outstanding = sum(l.outstanding_ksh for l in loans)

    # Active insurance
    insurance = InsurancePolicy.query.filter_by(
        farmer_id=farmer.id, status='active'
    ).all()

    return jsonify({
        "success": True,
        "data": {
            "income_ksh": income_ksh,
            "expenses_ksh": expenses_ksh,
            "net_profit_ksh": income_ksh - expenses_ksh,
            "active_loans_count": len(loans),
            "total_outstanding_ksh": total_outstanding,
            "active_policies_count": len(insurance),
        }
    }), 200


# ── LOANS ──────────────────────────────────────────────────

@financial_bp.route('/loans', methods=['GET'])
@jwt_required()
def list_loans():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": []}), 200

    loans = LoanRecord.query.filter_by(
        farmer_id=farmer.id
    ).order_by(LoanRecord.created_at.desc()).all()

    total_outstanding = sum(l.outstanding_ksh for l in loans
                            if l.status == 'active')
    overdue = [l for l in loans if l.is_overdue]

    return jsonify({
        "success": True,
        "data": {
            "loans": [l.to_dict() for l in loans],
            "total_outstanding_ksh": total_outstanding,
            "overdue_count": len(overdue),
            "total_loans": len(loans),
        }
    }), 200


@financial_bp.route('/loans', methods=['POST'])
@jwt_required()
def add_loan():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    data = request.get_json()

    loan = LoanRecord(
        farmer_id=farmer.id,
        lender_name=data.get('lender_name', ''),
        lender_type=data.get('lender_type'),
        loan_purpose=data.get('loan_purpose'),
        principal_ksh=float(data.get('principal_ksh', 0)),
        interest_rate_percent=data.get('interest_rate_percent'),
        disbursement_date=data.get('disbursement_date'),
        due_date=data.get('due_date'),
        repayment_frequency=data.get('repayment_frequency'),
        amount_repaid_ksh=float(data.get('amount_repaid_ksh', 0)),
        collateral=data.get('collateral'),
        notes=data.get('notes'),
    )

    db.session.add(loan)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": loan.to_dict(),
        "message": "Loan added"
    }), 201


@financial_bp.route('/loans/<loan_id>/repayment', methods=['POST'])
@jwt_required()
def add_loan_repayment(loan_id):
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    loan = LoanRecord.query.filter_by(
        id=loan_id, farmer_id=farmer.id
    ).first()

    if not loan:
        return jsonify({
            "success": False, "message": "Loan not found"
        }), 404

    data = request.get_json()
    amount = float(data.get('amount_ksh', 0))

    loan.amount_repaid_ksh = (loan.amount_repaid_ksh or 0) + amount

    if loan.amount_repaid_ksh >= loan.principal_ksh:
        loan.status = 'fully_paid'

    db.session.commit()

    return jsonify({
        "success": True,
        "data": loan.to_dict(),
        "message": "Repayment recorded"
    }), 200


# ── INSURANCE ──────────────────────────────────────────────

@financial_bp.route('/insurance', methods=['GET'])
@jwt_required()
def list_insurance():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": []}), 200

    policies = InsurancePolicy.query.filter_by(
        farmer_id=farmer.id
    ).order_by(InsurancePolicy.end_date.desc()).all()

    expiring_soon = [p for p in policies 
                     if p.days_to_expiry and p.days_to_expiry <= 30]

    return jsonify({
        "success": True,
        "data": {
            "policies": [p.to_dict() for p in policies],
            "expiring_soon": [p.to_dict() for p in expiring_soon],
            "total_policies": len(policies),
        }
    }), 200


@financial_bp.route('/insurance', methods=['POST'])
@jwt_required()
def add_insurance():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    data = request.get_json()

    policy = InsurancePolicy(
        farmer_id=farmer.id,
        provider_name=data.get('provider_name'),
        policy_number=data.get('policy_number'),
        insurance_type=data.get('insurance_type'),
        covered_crops=data.get('covered_crops'),
        coverage_amount_ksh=data.get('coverage_amount_ksh'),
        premium_ksh=data.get('premium_ksh'),
        premium_frequency=data.get('premium_frequency'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        notes=data.get('notes'),
    )

    db.session.add(policy)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": policy.to_dict(),
        "message": "Insurance policy added"
    }), 201


# ── BUDGET ────────────────────────────────────────────────

@financial_bp.route('/budgets', methods=['GET'])
@jwt_required()
def list_budgets():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)
    if not farmer:
        return jsonify({"success": True, "data": []}), 200

    budgets = SeasonBudget.query.filter_by(
        farmer_id=farmer.id
    ).order_by(SeasonBudget.created_at.desc()).all()

    return jsonify({
        "success": True,
        "data": [b.to_dict() for b in budgets]
    }), 200


@financial_bp.route('/budgets', methods=['POST'])
@jwt_required()
def add_budget():
    user_id = get_jwt_identity()
    farmer = get_farmer(user_id)

    data = request.get_json()

    budget = SeasonBudget(
        farmer_id=farmer.id,
        season_name=data.get('season_name'),
        crop_name=data.get('crop_name'),
        area_acres=data.get('area_acres', 1),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        planned_seed_ksh=data.get('planned_seed_ksh', 0),
        planned_fertilizer_ksh=data.get('planned_fertilizer_ksh', 0),
        planned_pesticide_ksh=data.get('planned_pesticide_ksh', 0),
        planned_labor_ksh=data.get('planned_labor_ksh', 0),
        planned_irrigation_ksh=data.get('planned_irrigation_ksh', 0),
        planned_transport_ksh=data.get('planned_transport_ksh', 0),
        planned_other_ksh=data.get('planned_other_ksh', 0),
        expected_yield_kg=data.get('expected_yield_kg'),
        expected_price_per_kg=data.get('expected_price_per_kg'),
        expected_revenue_ksh=data.get('expected_revenue_ksh'),
        notes=data.get('notes'),
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": budget.to_dict(),
        "message": "Budget created"
    }), 201
