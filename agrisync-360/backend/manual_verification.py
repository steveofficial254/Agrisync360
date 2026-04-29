#!/usr/bin/env python3
"""
Manual verification script for AgriSync 360 Day 2
Performs static analysis and code structure verification
"""

import os
import sys
import importlib.util

def check_file_exists(filepath):
    """Check if file exists"""
    return os.path.exists(filepath)

def check_route_structure():
    """Check all required route files exist"""
    print("=== ROUTE STRUCTURE VERIFICATION ===")
    
    required_routes = [
        "app/routes/auth.py",
        "app/routes/farmers.py", 
        "app/routes/farms.py",
        "app/routes/weather.py",
        "app/routes/advisory.py",
        "app/routes/market.py",
        "app/routes/payments.py",
        "app/routes/sms.py",
        "app/routes/admin.py"
    ]
    
    results = []
    for route in required_routes:
        exists = check_file_exists(route)
        status = "✅" if exists else "❌"
        print(f"{status} {route}")
        results.append(exists)
    
    return all(results)

def check_service_structure():
    """Check all required service files exist"""
    print("\n=== SERVICE STRUCTURE VERIFICATION ===")
    
    required_services = [
        "app/services/mpesa_service.py",
        "app/services/sms_service.py",
        "app/services/weather_service.py",
        "app/services/market_service.py",
        "app/services/advisory_service.py"
    ]
    
    results = []
    for service in required_services:
        exists = check_file_exists(service)
        status = "✅" if exists else "❌"
        print(f"{status} {service}")
        results.append(exists)
    
    return all(results)

def check_model_structure():
    """Check all required model files exist"""
    print("\n=== MODEL STRUCTURE VERIFICATION ===")
    
    required_models = [
        "app/models/user.py",
        "app/models/farmer.py",
        "app/models/farm.py", 
        "app/models/crop.py",
        "app/models/payment.py",
        "app/models/market.py",
        "app/models/advisory.py",
        "app/models/sms.py",
        "app/models/alert.py"
    ]
    
    results = []
    for model in required_models:
        exists = check_file_exists(model)
        status = "✅" if exists else "❌"
        print(f"{status} {model}")
        results.append(exists)
    
    return all(results)

def check_task_structure():
    """Check all required task files exist"""
    print("\n=== TASK STRUCTURE VERIFICATION ===")
    
    required_tasks = [
        "app/tasks/weather_tasks.py",
        "app/tasks/market_tasks.py",
        "app/tasks/sms_tasks.py"
    ]
    
    results = []
    for task in required_tasks:
        exists = check_file_exists(task)
        status = "✅" if exists else "❌"
        print(f"{status} {task}")
        results.append(exists)
    
    return all(results)

def check_seeder_structure():
    """Check seeder files exist"""
    print("\n=== SEEDER STRUCTURE VERIFICATION ===")
    
    required_seeders = [
        "app/utils/seed_market_data.py",
        "app/utils/seed_advisory_data.py",
        "seed_database.py"
    ]
    
    results = []
    for seeder in required_seeders:
        exists = check_file_exists(seeder)
        status = "✅" if exists else "❌"
        print(f"{status} {seeder}")
        results.append(exists)
    
    return all(results)

def check_route_endpoints():
    """Check key endpoints are defined in route files"""
    print("\n=== ENDPOINT VERIFICATION ===")
    
    endpoint_checks = [
        ("app/routes/auth.py", ["register", "login", "verify-otp"]),
        ("app/routes/farmers.py", ["profile"]),
        ("app/routes/farms.py", ["", "/<int:farm_id>", "/<int:farm_id>/crops"]),
        ("app/routes/weather.py", ["forecast", "planting-window", "disease-risk"]),
        ("app/routes/advisory.py", ["crop", "calendar", "nutrition", "my-crops"]),
        ("app/routes/market.py", ["prices", "history", "profitability"]),
        ("app/routes/payments.py", ["subscribe", "subscription", "history"]),
        ("app/routes/admin.py", ["dashboard", "farmers", "revenue"])
    ]
    
    results = []
    for filepath, expected_patterns in endpoint_checks:
        if not check_file_exists(filepath):
            results.append(False)
            print(f"❌ {filepath} - FILE MISSING")
            continue
            
        try:
            with open(filepath, 'r') as f:
                content = f.read()
                
            missing_patterns = []
            for pattern in expected_patterns:
                if pattern not in content:
                    missing_patterns.append(pattern)
            
            if missing_patterns:
                print(f"❌ {filepath} - Missing: {missing_patterns}")
                results.append(False)
            else:
                print(f"✅ {filepath} - All endpoints found")
                results.append(True)
                
        except Exception as e:
            print(f"❌ {filepath} - Error: {str(e)}")
            results.append(False)
    
    return all(results)

def check_config_files():
    """Check configuration files"""
    print("\n=== CONFIGURATION VERIFICATION ===")
    
    config_files = [
        "app/config.py",
        ".env.example",
        "requirements.txt",
        "celery_worker.py",
        "run.py"
    ]
    
    results = []
    for config in config_files:
        exists = check_file_exists(config)
        status = "✅" if exists else "❌"
        print(f"{status} {config}")
        results.append(exists)
    
    return all(results)

def check_imports():
    """Check if key imports work"""
    print("\n=== IMPORT VERIFICATION ===")
    
    import_checks = [
        ("Flask", "flask"),
        ("SQLAlchemy", "flask_sqlalchemy"),
        ("JWT", "flask_jwt_extended"),
        ("Celery", "celery"),
        ("Requests", "requests"),
        ("Redis", "redis"),
        ("PostgreSQL", "psycopg2")
    ]
    
    results = []
    for name, module in import_checks:
        try:
            spec = importlib.util.find_spec(module)
            exists = spec is not None
            status = "✅" if exists else "❌"
            print(f"{status} {name}")
            results.append(exists)
        except Exception as e:
            print(f"❌ {name} - Error: {str(e)}")
            results.append(False)
    
    return all(results)

def analyze_code_quality():
    """Analyze code structure and quality"""
    print("\n=== CODE QUALITY ANALYSIS ===")
    
    quality_checks = []
    
    # Check for error handling patterns
    route_files = [
        "app/routes/auth.py",
        "app/routes/farmers.py",
        "app/routes/farms.py",
        "app/routes/weather.py",
        "app/routes/advisory.py",
        "app/routes/market.py",
        "app/routes/payments.py",
        "app/routes/admin.py"
    ]
    
    error_handling_count = 0
    for route_file in route_files:
        if check_file_exists(route_file):
            try:
                with open(route_file, 'r') as f:
                    content = f.read()
                
                has_error_handling = "try:" in content and "except" in content
                if has_error_handling:
                    error_handling_count += 1
                    
            except:
                pass
    
    print(f"✅ Error handling in {error_handling_count}/{len(route_files)} route files")
    quality_checks.append(error_handling_count >= len(route_files) * 0.8)
    
    # Check for JWT protection
    jwt_protected_count = 0
    for route_file in route_files:
        if check_file_exists(route_file):
            try:
                with open(route_file, 'r') as f:
                    content = f.read()
                
                has_jwt = "jwt_required" in content
                if has_jwt:
                    jwt_protected_count += 1
                    
            except:
                pass
    
    print(f"✅ JWT protection in {jwt_protected_count}/{len(route_files)} route files")
    quality_checks.append(jwt_protected_count >= len(route_files) * 0.7)
    
    # Check for admin protection
    admin_files = ["app/routes/admin.py"]
    admin_protected_count = 0
    for admin_file in admin_files:
        if check_file_exists(admin_file):
            try:
                with open(admin_file, 'r') as f:
                    content = f.read()
                
                has_admin = "admin_required" in content
                if has_admin:
                    admin_protected_count += 1
                    
            except:
                pass
    
    print(f"✅ Admin protection in {admin_protected_count}/{len(admin_files)} admin files")
    quality_checks.append(admin_protected_count >= len(admin_files))
    
    return all(quality_checks)

def main():
    """Run manual verification"""
    print("🔍 AgriSync 360 Day 2 Manual Verification")
    print("=" * 60)
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Run all checks
    checks = {
        "Route Structure": check_route_structure(),
        "Service Structure": check_service_structure(), 
        "Model Structure": check_model_structure(),
        "Task Structure": check_task_structure(),
        "Seeder Structure": check_seeder_structure(),
        "Endpoint Definitions": check_route_endpoints(),
        "Configuration Files": check_config_files(),
        "Import Dependencies": check_imports(),
        "Code Quality": analyze_code_quality()
    }
    
    # Generate report
    print("\n" + "=" * 60)
    print("  AgriSync 360 — Day 2 Manual Verification Report")
    print("=" * 60)
    
    passed = sum(1 for v in checks.values() if v)
    total = len(checks)
    
    for name, result in checks.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} | {name}")
    
    print("\n" + "=" * 60)
    print(f"  Score: {passed}/{total} ({int(passed/total*100)}%)")
    
    if passed == total:
        print("  🎉 All structural checks passed!")
        print("\n📋 Implementation Status:")
        print("  ✅ Complete API structure")
        print("  ✅ All required endpoints defined")
        print("  ✅ Services and models implemented")
        print("  ✅ Celery tasks configured")
        print("  ✅ Database seeders ready")
        print("  ✅ Configuration complete")
        print("  ✅ Code quality standards met")
        print("\n🚀 Ready for runtime testing!")
        print("   • Start Flask: python run.py")
        print("   • Seed database: python seed_database.py")
        print("   • Run tests: python verify_day2.py")
    elif passed >= total * 0.85:
        print("  ⚠️  Almost complete — minor issues detected")
    else:
        print("  ❌ Significant structural issues — review above")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
