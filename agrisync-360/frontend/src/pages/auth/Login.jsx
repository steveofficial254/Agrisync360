import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Sprout,
  Smartphone,
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDashboardPath } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    password: '',
    phone: '',
    email: '',
    rememberMe: false
  });

  // Show success message if redirected from registration
  React.useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location.state]);

  const validateForm = () => {
    setError('');

    if (loginMethod === 'phone') {
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return false;
      }
      if (!/^(07|01)\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
        setError('Please enter a valid Kenyan phone number');
        return false;
      }
    } else {
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Use authAPI which handles mock/real API switching
      const payload = {
        password: formData.password
      };

      if (loginMethod === 'phone') {
        payload.phone = formData.phone;
      } else {
        payload.email = formData.email;
      }

      const response = await authAPI.login(payload);

      const data = response.data;

      // Handle both success: true format and direct data format
      const responseData = data.success ? data.data : data;
      const { access_token, refresh_token, user } = responseData;

      // Validate we got a token
      if (!access_token) {
        throw new Error('No access token received');
      }

      // Save auth state using the new login function
      login(user, access_token, refresh_token);

      setSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        const userRole = user?.role || 'farmer';
        navigate(getDashboardPath(userRole));
      }, 1500);
    } catch (err) {
      const msg = err?.message || 'Invalid phone or password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display mb-2">AgriSync 360</h1>
          <p className="text-gray-600">Welcome back! Sign in to your account</p>
        </div>

        <Card className="p-8">
          
          {/* Error/Success Alerts */}
          {error && (
            <Alert
              type="error"
              message={error}
              className="mb-6"
              dismissible
              onDismiss={() => setError('')}
            />
          )}
          
          {success && (
            <Alert
              type="success"
              message={success}
              className="mb-6"
            />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {loginMethod === 'phone' ? (
              <Input
                label="Phone Number"
                placeholder="07XX XXX XXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                leftIcon="phone"
                required
                hint="Format: 07XX XXX XXX (Use 0777000001 for admin, 0777000002 for dealer, 0777000003 for NGO)"
              />
            ) : (
              <Input
                label="Email Address"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                leftIcon="email"
                required
                hint="Use admin@agrisync.com for admin, dealer@agrisync.com for dealer, ngo@agrisync.com for NGO"
              />
            )}

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              leftIcon="password"
              showPasswordToggle
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              
              <a
                href="/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
              size="lg"
              rightIcon={<User className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        </Card>

          {/* USSD Option */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Or use our USSD service</p>
              <div className="inline-flex items-center bg-gray-50 rounded-lg p-3">
                <Smartphone className="w-5 h-5 text-green-600 mr-2" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">Dial *384*360#</p>
                  <p className="text-xs text-gray-500">No internet required</p>
                </div>
              </div>
            </div>
          </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Sign up here
            </a>
          </p>
        </div>

        {/* Login Options */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-green-50 to-emerald-50 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button
              variant="outline"
              className={`w-full ${loginMethod === 'phone' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200 hover:border-green-300'}`}
              leftIcon={<Smartphone className="w-4 h-4" />}
              onClick={() => setLoginMethod('phone')}
              type="button"
            >
              Phone Login
            </Button>
            <Button
              variant="outline"
              className={`w-full ${loginMethod === 'email' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200 hover:border-green-300'}`}
              leftIcon={<Mail className="w-4 h-4" />}
              onClick={() => setLoginMethod('email')}
              type="button"
            >
              Email Login
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="#" className="text-green-600 hover:text-green-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
