import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDashboardPath } = useAuth();
  
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get phone from location state or localStorage
  const phone = location.state?.phone || localStorage.getItem('registration_phone');
  const message = location.state?.message || 'Enter the OTP code sent to your phone';

  useEffect(() => {
    if (!phone) {
      navigate('/register');
    }
  }, [phone, navigate]);

  const validateForm = () => {
    setError('');
    
    if (!otpCode.trim()) {
      setError('OTP code is required');
      return false;
    }
    
    if (otpCode.length !== 6) {
      setError('OTP code must be 6 digits');
      return false;
    }
    
    if (!/^\d{6}$/.test(otpCode)) {
      setError('OTP code must contain only numbers');
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
      const response = await API.post('/auth/verify-otp', {
        phone: phone,
        otp_code: otpCode
      });
      
      const data = response.data;
      
      if (data.success) {
        setSuccess('Phone verified successfully!');
        
        // Store tokens and user data
        const { access_token, refresh_token, user } = data.data;
        
        // Validate we got a token
        if (!access_token) {
          throw new Error('No token received after verification');
        }

        // Save auth state using the new login function
        login(user, access_token, refresh_token);

        // Clear registration phone from localStorage
        localStorage.removeItem('registration_phone');
        
        // Show success message and redirect to dashboard
        toast.success('Account verified successfully!');
        
        setTimeout(() => {
          navigate(getDashboardPath(user?.role || 'farmer'));
        }, 1500);
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
    } catch (err) {
      const msg = err?.message || 'OTP verification failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authAPI.resendOTP({ phone });
      const data = (await response).data;
      
      if (data.success) {
        let msg = 'OTP resent successfully!';
        if (data.data?.otp) {
          msg += ` (Dev OTP: ${data.data.otp})`;
          toast.success(`Dev OTP: ${data.data.otp}`, { duration: 10000 });
        } else {
          toast.success(msg);
        }
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display mb-2">Verify Phone</h1>
          <p className="text-gray-600">{message}</p>
          {phone && (
            <p className="text-sm text-gray-500 mt-2">
              Phone: {phone}
            </p>
          )}
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

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="OTP Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              leftIcon="shield"
              maxLength={6}
              required
              hint="Enter the 6-digit code sent to your phone"
              className="text-center text-2xl tracking-widest"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                disabled={isLoading}
              >
                Back
              </Button>
              
              <Button
                variant="primary"
                type="submit"
                isLoading={isLoading}
                className="flex-1"
                rightIcon={<CheckCircle className="w-4 h-4" />}
              >
                Verify
              </Button>
            </div>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              isLoading={isLoading}
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              Resend OTP
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
