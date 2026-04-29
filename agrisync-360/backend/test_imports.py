#!/usr/bin/env python3

print("Testing imports...")

try:
    from app import create_app
    print("✅ App import OK")
except Exception as e:
    print(f"❌ App import failed: {e}")
    exit(1)

try:
    from app.models.user import User
    print("✅ User model import OK")
except Exception as e:
    print(f"❌ User model import failed: {e}")
    exit(1)

try:
    from app.models.agro_dealer import AgroDealer
    print("✅ AgroDealer model import OK")
except Exception as e:
    print(f"❌ AgroDealer model import failed: {e}")
    exit(1)

try:
    from app.models.ngo import NGOProfile
    print("✅ NGO model import OK")
except Exception as e:
    print(f"❌ NGO model import failed: {e}")
    exit(1)

try:
    from app.services.ussd_service import USSDService
    print("✅ USSD service import OK")
except Exception as e:
    print(f"❌ USSD service import failed: {e}")
    exit(1)

try:
    from app.utils.plans import PLAN_PRICES, PLAN_FEATURES
    print("✅ Plans import OK")
except Exception as e:
    print(f"❌ Plans import failed: {e}")
    exit(1)

try:
    from app.utils.decorators import role_required, subscription_required
    print("✅ Decorators import OK")
except Exception as e:
    print(f"❌ Decorators import failed: {e}")
    exit(1)

print("\n✅ All imports successful!")
print("Creating app...")

try:
    app = create_app('development')
    print("✅ App created successfully")
except Exception as e:
    print(f"❌ App creation failed: {e}")
    exit(1)

print("\n✅ Backend is ready for testing!")
