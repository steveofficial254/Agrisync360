#!/usr/bin/env python3
"""
Enterprise Features Verification Script
Tests all new enterprise feature endpoints
"""
import requests
import json
import sys
from datetime import date, timedelta

BASE_URL = 'http://localhost:5000'
TEST_PHONE = '+254700000000'
TEST_PASSWORD = 'test123'

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

results = []

def log_test(name, passed, details=''):
    status = f'{GREEN}✓ PASS{RESET}' if passed else f'{RED}✗ FAIL{RESET}'
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    results.append({'name': name, 'passed': passed, 'details': details})

def test_endpoint(method, endpoint, data=None, token=None, expected_status=200):
    url = f"{BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        
        return response.status_code == expected_status, response.json() if response.text else None
    except Exception as e:
        return False, str(e)

def main():
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}Enterprise Features Verification{RESET}")
    print(f"{YELLOW}{'='*60}{RESET}\n")
    
    # Test 1: Register/Login
    print(f"{YELLOW}1. Authentication{RESET}")
    success, _ = test_endpoint('POST', '/api/auth/register', {
        'phone': TEST_PHONE,
        'password': TEST_PASSWORD,
        'role': 'farmer'
    }, expected_status=201)
    log_test('Register farmer', success)
    
    success, data = test_endpoint('POST', '/api/auth/login', {
        'phone': TEST_PHONE,
        'password': TEST_PASSWORD
    }, expected_status=200)
    log_test('Login farmer', success)
    token = data.get('access_token') if success else None
    
    if not token:
        print(f"{RED}Failed to get token, stopping tests{RESET}")
        return
    
    print(f"\n{YELLOW}2. Farm Intelligence{RESET}")
    
    # Planting Calendar
    success, _ = test_endpoint('GET', '/api/calendar/', token=token)
    log_test('List calendar entries', success)
    
    success, _ = test_endpoint('POST', '/api/calendar/', {
        'crop_name': 'maize',
        'planned_planting_date': (date.today() + timedelta(days=7)).isoformat(),
        'area_acres': 2
    }, token=token, expected_status=201)
    log_test('Create calendar entry', success)
    
    # Soil Health
    success, _ = test_endpoint('GET', '/api/soil/', token=token)
    log_test('List soil records', success)
    
    success, _ = test_endpoint('POST', '/api/soil/', {
        'test_date': date.today().isoformat(),
        'ph_level': 6.5,
        'nitrogen_ppm': 50
    }, token=token, expected_status=201)
    log_test('Add soil record', success)
    
    # Irrigation
    success, _ = test_endpoint('GET', '/api/irrigation/', token=token)
    log_test('List irrigation schedules', success)
    
    success, _ = test_endpoint('POST', '/api/irrigation/', {
        'crop_name': 'maize',
        'scheduled_date': (date.today() + timedelta(days=3)).isoformat(),
        'irrigation_type': 'drip'
    }, token=token, expected_status=201)
    log_test('Create irrigation schedule', success)
    
    # Pest Library (public)
    success, _ = test_endpoint('GET', '/api/pest-library/')
    log_test('Search pest library (public)', success)
    
    success, _ = test_endpoint('GET', '/api/pest-library/?search=armyworm')
    log_test('Search pest library with query', success)
    
    print(f"\n{YELLOW}3. Financial Management{RESET}")
    
    # Transactions
    success, _ = test_endpoint('GET', '/api/financial/transactions', token=token)
    log_test('List transactions', success)
    
    success, _ = test_endpoint('POST', '/api/financial/transactions', {
        'transaction_type': 'expense',
        'category': 'seeds',
        'amount_ksh': 5000,
        'description': 'Maize seeds'
    }, token=token, expected_status=201)
    log_test('Add transaction', success)
    
    success, _ = test_endpoint('GET', '/api/financial/dashboard', token=token)
    log_test('Financial dashboard', success)
    
    success, _ = test_endpoint('GET', '/api/financial/pl-report', token=token)
    log_test('P&L Report', success)
    
    # Loans
    success, _ = test_endpoint('GET', '/api/financial/loans', token=token)
    log_test('List loans', success)
    
    success, _ = test_endpoint('POST', '/api/financial/loans', {
        'lender_name': 'Test Bank',
        'principal_ksh': 100000,
        'interest_rate_percent': 12
    }, token=token, expected_status=201)
    log_test('Add loan', success)
    
    # Insurance
    success, _ = test_endpoint('GET', '/api/financial/insurance', token=token)
    log_test('List insurance policies', success)
    
    success, _ = test_endpoint('POST', '/api/financial/insurance', {
        'provider_name': 'Test Insurance',
        'insurance_type': 'crop',
        'premium_ksh': 5000
    }, token=token, expected_status=201)
    log_test('Add insurance policy', success)
    
    # Budgets
    success, _ = test_endpoint('GET', '/api/financial/budgets', token=token)
    log_test('List budgets', success)
    
    success, _ = test_endpoint('POST', '/api/financial/budgets', {
        'season_name': 'Long Rains 2024',
        'crop_name': 'maize',
        'area_acres': 2
    }, token=token, expected_status=201)
    log_test('Add budget', success)
    
    print(f"\n{YELLOW}4. Market Pro{RESET}")
    
    # Price Alerts
    success, _ = test_endpoint('GET', '/api/market/alerts', token=token)
    log_test('List price alerts', success)
    
    success, _ = test_endpoint('POST', '/api/market/alerts', {
        'crop_name': 'maize',
        'target_price_ksh': 3000,
        'condition': 'above'
    }, token=token, expected_status=201)
    log_test('Create price alert', success)
    
    # Buyer Directory (public)
    success, _ = test_endpoint('GET', '/api/market/buyers')
    log_test('List buyers (public)', success)
    
    success, _ = test_endpoint('GET', '/api/market/buyers?crop=maize')
    log_test('Filter buyers by crop', success)
    
    # Summary
    print(f"\n{YELLOW}{'='*60}{RESET}")
    total = len(results)
    passed = sum(1 for r in results if r['passed'])
    failed = total - passed
    score = (passed / total * 100) if total > 0 else 0
    
    print(f"{YELLOW}Summary:{RESET}")
    print(f"  Total: {total}")
    print(f"  {GREEN}Passed: {passed}{RESET}")
    print(f"  {RED}Failed: {failed}{RESET}")
    print(f"  Score: {score:.1f}%")
    print(f"{YELLOW}{'='*60}{RESET}\n")
    
    if score == 100:
        print(f"{GREEN}✓ All tests passed!{RESET}")
        return 0
    else:
        print(f"{RED}✗ Some tests failed{RESET}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
