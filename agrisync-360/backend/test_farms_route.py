#!/usr/bin/env python3
"""
Test script to check if farms route is working
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing farms route import...")
    from app.routes.farms import farms_bp
    print("✅ Farms blueprint imported successfully")
    
    print("Testing blueprint rules...")
    for rule in farms_bp.deferred_functions:
        print(f"  Rule: {rule}")
    
    print("✅ All tests passed!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)
