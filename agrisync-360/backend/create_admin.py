#!/usr/bin/env python3
"""
Quick script to create admin user for testing
"""

import os
import sys
from werkzeug.security import generate_password_hash

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

def create_admin_user():
    """Create admin user with secure password"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Check if admin user already exists
            admin = User.query.filter_by(email="admin@agrisync360.com").first()
            if admin:
                print("✅ Admin user already exists")
                print(f"   Email: admin@agrisync360.com")
                print(f"   Phone: +254700000001")
                print("   ⚠️  Password: [Check existing password or create new user]")
                return
            
            # Generate secure password
            password = "Admin123!"  # Simple password for testing
            
            # Create admin user
            admin_user = User(
                email="admin@agrisync360.com",
                phone="+254700000001",
                password_hash=generate_password_hash(password),
                role="admin",
                is_active=True,
                is_verified=True
            )
            
            db.session.add(admin_user)
            db.session.commit()
            
            print("✅ Admin user created successfully!")
            print(f"   Email: admin@agrisync360.com")
            print(f"   Phone: +254700000001")
            print(f"   Password: {password}")
            print(f"   Dashboard: /admin")
            print("\n🚀 Ready for testing!")
            
        except Exception as e:
            print(f"❌ Error creating admin user: {str(e)}")
            db.session.rollback()

if __name__ == "__main__":
    create_admin_user()
