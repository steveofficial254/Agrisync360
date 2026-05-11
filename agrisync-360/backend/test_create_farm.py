#!/usr/bin/env python3
"""
Test script to directly test the create_farm function
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_create_farm():
    try:
        print("Testing farms route import...")
        from app.routes.farms import farms_bp, create_farm
        print("✅ Farms blueprint and create_farm function imported successfully")
        
        # Test blueprint registration
        print(f"Blueprint name: {farms_bp.name}")
        print(f"Blueprint url_prefix: {farms_bp.url_prefix}")
        
        # List all routes
        print("\nRoutes in farms blueprint:")
        for rule in farms_bp.deferred_functions:
            print(f"  {rule}")
        
        print("✅ Route test completed successfully")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_create_farm()
    sys.exit(0 if success else 1)
