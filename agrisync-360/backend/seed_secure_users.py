#!/usr/bin/env python3
"""
AgriSync 360 Secure User Seeding Script
Creates default admin and dealer users with secure credentials.
Passwords are generated randomly and not hardcoded for security.
"""

import os
import sys
import secrets
import string
from datetime import datetime
from werkzeug.security import generate_password_hash

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

def generate_secure_password(length=12):
    """Generate a secure random password"""
    # Include uppercase, lowercase, digits, and special characters
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def create_default_admin():
    """Create default admin user with secure credentials"""
    try:
        # Check if admin user already exists
        admin = User.query.filter_by(email="admin@agrisync360.com").first()
        if admin:
            print("✅ Admin user already exists")
            return admin, None  # Return None for password since it already exists
        
        # Generate secure password
        admin_password = generate_secure_password()
        
        # Create admin user
        admin = User(
            email="admin@agrisync360.com",
            phone="+254700000001",  # Different from seed_database
            password_hash=generate_password_hash(admin_password),
            role="admin",
            is_active=True,
            is_verified=True
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Admin user created successfully")
        return admin, admin_password
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        db.session.rollback()
        return None, None

def create_default_dealer():
    """Create default agro-dealer user with secure credentials"""
    try:
        # Check if dealer user already exists
        dealer = User.query.filter_by(email="dealer@agrisync360.com").first()
        if dealer:
            print("✅ Dealer user already exists")
            return dealer, None  # Return None for password since it already exists
        
        # Generate secure password
        dealer_password = generate_secure_password()
        
        # Create dealer user
        dealer = User(
            email="dealer@agrisync360.com",
            phone="+254700000002",  # Different from seed_database
            password_hash=generate_password_hash(dealer_password),
            role="agro_dealer",
            is_active=True,
            is_verified=True
        )
        
        db.session.add(dealer)
        db.session.commit()
        
        print("✅ Dealer user created successfully")
        return dealer, dealer_password
        
    except Exception as e:
        print(f"❌ Error creating dealer user: {str(e)}")
        db.session.rollback()
        return None, None

def create_default_ngo():
    """Create default NGO partner user with secure credentials"""
    try:
        # Check if NGO user already exists
        ngo = User.query.filter_by(email="ngo@agrisync360.com").first()
        if ngo:
            print("✅ NGO user already exists")
            return ngo, None  # Return None for password since it already exists
        
        # Generate secure password
        ngo_password = generate_secure_password()
        
        # Create NGO user
        ngo = User(
            email="ngo@agrisync360.com",
            phone="+254700000003",  # Different from seed_database
            password_hash=generate_password_hash(ngo_password),
            role="ngo_partner",
            is_active=True,
            is_verified=True
        )
        
        db.session.add(ngo)
        db.session.commit()
        
        print("✅ NGO user created successfully")
        return ngo, ngo_password
        
    except Exception as e:
        print(f"❌ Error creating NGO user: {str(e)}")
        db.session.rollback()
        return None, None

def create_credentials_file(credentials):
    """Create a secure credentials file with proper permissions"""
    try:
        credentials_file = "SECURE_CREDENTIALS.txt"
        
        with open(credentials_file, 'w') as f:
            f.write("🔐 AgriSync 360 - Default User Credentials\n")
            f.write("=" * 50 + "\n")
            f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("\n⚠️  IMPORTANT SECURITY NOTICE:\n")
            f.write("1. Change these passwords immediately after first login\n")
            f.write("2. Store this file securely\n")
            f.write("3. Delete this file after changing passwords\n")
            f.write("4. Never commit this file to version control\n")
            f.write("\n" + "=" * 50 + "\n\n")
            
            for user_type, data in credentials.items():
                if data['password']:  # Only show if password was newly generated
                    f.write(f"👤 {user_type.upper()} USER:\n")
                    f.write(f"   Email: {data['email']}\n")
                    f.write(f"   Phone: {data['phone']}\n")
                    f.write(f"   Password: {data['password']}\n")
                    f.write(f"   Role: {data['role']}\n")
                    f.write(f"   Dashboard: {data['dashboard_url']}\n")
                    f.write("\n")
        
        # Set file permissions (read/write for owner only)
        os.chmod(credentials_file, 0o600)
        
        print(f"📄 Credentials saved to: {credentials_file}")
        print("🔒 File permissions set to read/write for owner only")
        
    except Exception as e:
        print(f"❌ Error creating credentials file: {str(e)}")

def main():
    """Main secure seeding function"""
    print("🔐 Starting Secure User Creation for AgriSync 360")
    print("=" * 50)
    
    # Create Flask app and database context
    app = create_app('development')
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created/verified")
            
            # Create secure default users
            print("\n👨‍💼 Creating Admin User...")
            admin_user, admin_password = create_default_admin()
            
            print("\n🏪 Creating Dealer User...")
            dealer_user, dealer_password = create_default_dealer()
            
            print("\n🏛️ Creating NGO User...")
            ngo_user, ngo_password = create_default_ngo()
            
            # Prepare credentials for file
            credentials = {
                'admin': {
                    'email': 'admin@agrisync360.com',
                    'phone': '+254700000001',
                    'password': admin_password,
                    'role': 'admin',
                    'dashboard_url': '/admin'
                },
                'dealer': {
                    'email': 'dealer@agrisync360.com',
                    'phone': '+254700000002',
                    'password': dealer_password,
                    'role': 'agro_dealer',
                    'dashboard_url': '/dealer'
                },
                'ngo': {
                    'email': 'ngo@agrisync360.com',
                    'phone': '+254700000003',
                    'password': ngo_password,
                    'role': 'ngo_partner',
                    'dashboard_url': '/ngo'
                }
            }
            
            # Create credentials file
            create_credentials_file(credentials)
            
            print("\n" + "=" * 50)
            print("🎉 Secure user creation completed successfully!")
            print("\n📊 Summary:")
            print(f"   • Admin user: {'Created' if admin_password else 'Exists'}")
            print(f"   • Dealer user: {'Created' if dealer_password else 'Exists'}")
            print(f"   • NGO user: {'Created' if ngo_password else 'Exists'}")
            
            print("\n🔑 Dashboard Access URLs:")
            print("   • Admin Dashboard: http://localhost:5000/admin")
            print("   • Dealer Dashboard: http://localhost:5000/dealer")
            print("   • NGO Dashboard: http://localhost:5000/ngo")
            
            if any([admin_password, dealer_password, ngo_password]):
                print("\n📄 Check SECURE_CREDENTIALS.txt for login details")
                print("⚠️  Remember to change passwords and delete the credentials file!")
            
            print("\n🚀 Ready for testing!")
            
        except Exception as e:
            print(f"\n❌ Secure user creation failed: {str(e)}")
            print("Please check the error above and fix any issues.")
            sys.exit(1)

if __name__ == "__main__":
    main()
