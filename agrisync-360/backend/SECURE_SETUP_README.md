# 🔐 AgriSync 360 - Secure User Setup Guide

## Overview
This guide explains how to set up default admin and dealer users with secure credentials, removing hardcoded passwords for enhanced security.

## Security Features
- ✅ **Random Password Generation**: No hardcoded passwords
- ✅ **Secure Credential Files**: Encrypted file permissions (600)
- ✅ **Automatic Cleanup**: Instructions to delete credentials after use
- ✅ **Role-Based Access**: Separate credentials for each user role

## Available Scripts

### 1. Quick Secure Setup (Recommended)
```bash
python seed_secure_users.py
```
Creates only essential users (Admin, Dealer, NGO) with secure passwords.

### 2. Full Database Seeding (Updated)
```bash
python seed_database.py
```
Creates complete test data including farmers, farms, and crops with secure passwords.

## Default User Accounts

### 👨‍💼 Admin User
- **Email**: `admin@agrisync360.com`
- **Phone**: `+254700000001`
- **Role**: `admin`
- **Dashboard**: `/admin`
- **Access**: Full system administration

### 🏪 Agro-Dealer User
- **Email**: `dealer@agrisync360.com`
- **Phone**: `+254700000002`
- **Role**: `agro_dealer`
- **Dashboard**: `/dealer`
- **Access**: Dealer management tools

### 🏛️ NGO Partner User
- **Email**: `ngo@agrisync360.com`
- **Phone**: `+254700000003`
- **Role**: `ngo_partner`
- **Dashboard**: `/ngo`
- **Access**: NGO monitoring tools

### 🧑‍🌾 Test Farmers (Full Seeding Only)
- **Email**: Various (john.mutua@agrisync360.com, etc.)
- **Role**: `farmer`
- **Dashboard**: `/dashboard`
- **Access**: Farmer tools and features

## 🔑 Accessing Different Dashboards

### Method 1: Direct URL
After logging in, navigate to:
- **Admin**: `http://localhost:5000/admin`
- **Dealer**: `http://localhost:5000/dealer`
- **NGO**: `http://localhost:5000/ngo`
- **Farmer**: `http://localhost:5000/dashboard`

### Method 2: Automatic Redirect
The system automatically redirects users to their appropriate dashboard based on role after login.

## 📄 Credential Files

### What is SECURE_CREDENTIALS.txt?
- Contains auto-generated passwords for new users
- **Permissions**: Read/write for owner only (600)
- **Location**: Backend root directory
- **Format**: Human-readable with security notices

### Important Security Notes
⚠️ **CRITICAL**: Follow these security practices:

1. **Change Passwords Immediately**: Log in and change default passwords on first use
2. **Secure Storage**: Keep the credentials file in a secure location
3. **Delete After Use**: Remove the credentials file after changing passwords
4. **Never Commit**: Do NOT commit credentials files to version control
5. **Use Environment Variables**: In production, use environment variables for initial setup

## 🚀 Quick Start

### 1. Set Up Admin and Dealer Accounts
```bash
cd backend
python seed_secure_users.py
```

### 2. Check Credentials
```bash
cat SECURE_CREDENTIALS.txt
```

### 3. Log In and Change Passwords
- Visit `http://localhost:5000/login`
- Use credentials from the file
- Navigate to profile and change passwords
- Delete the credentials file

### 4. Access Dashboards
- **Admin**: Go to `/admin`
- **Dealer**: Go to `/dealer`
- **NGO**: Go to `/ngo`

## 🔧 Advanced Usage

### Custom Password Generation
The `generate_secure_password()` function creates 12-character passwords with:
- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Special characters (!@#$%^&*)

### Environment-Specific Setup
```python
# In production, use environment variables
import os

admin_password = os.getenv('ADMIN_PASSWORD') or generate_secure_password()
```

### Database Migration Safety
The scripts check for existing users before creating new ones:
- ✅ Won't overwrite existing users
- ✅ Returns existing user info if already present
- ✅ Generates new credentials only for new users

## 🛡️ Security Best Practices

### Development Environment
- Use secure auto-generated passwords
- Change passwords regularly
- Delete credential files after use

### Production Environment
- Use environment variables for initial passwords
- Implement password expiration policies
- Enable two-factor authentication
- Regular security audits

### Password Policy Recommendations
- **Minimum Length**: 12 characters
- **Complexity**: Mix of uppercase, lowercase, numbers, symbols
- **Expiration**: Change every 90 days
- **History**: Don't reuse recent passwords

## 🔄 Resetting Credentials

If you need to reset user credentials:

### Option 1: Delete and Recreate
```sql
-- In database
DELETE FROM users WHERE email = 'admin@agrisync360.com';
```
Then run the seeding script again.

### Option 2: Manual Password Update
```python
# In Python shell
from app import create_app, db
from app.models.user import User
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='admin@agrisync360.com').first()
    user.password_hash = generate_password_hash('new_secure_password')
    db.session.commit()
```

## 📞 Support

For security issues or questions:
1. Check the logs for error messages
2. Verify database connectivity
3. Ensure proper file permissions
4. Review environment variables

## 🎯 Summary

- ✅ **No Hardcoded Passwords**: All passwords are randomly generated
- ✅ **Secure Storage**: Credentials saved with proper file permissions
- ✅ **Multiple User Types**: Admin, Dealer, NGO, and Farmer accounts
- ✅ **Easy Access**: Direct URLs for each dashboard type
- ✅ **Security First**: Clear instructions for password management

This setup ensures your AgriSync 360 application has secure, role-based access without compromising on security through hardcoded credentials.
