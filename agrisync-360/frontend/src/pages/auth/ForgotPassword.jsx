import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, Lock, CheckCircle } from 'lucide-react';
import authAPI from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Step 1: Phone
  const [phone, setPhone] = useState('');
  
  // Step 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  
  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.forgotPassword({ phone });
      const data = response.data;
      
      if (data.success) {
        setSuccess('Reset code sent to your phone');
        setStep(2);
        
        // In development, show OTP
        if (import.meta.env.DEV && data.data?.otp) {
          console.log('DEV OTP:', data.data.otp);
        }
      } else {
        setError(data.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const otpCode = otp.join('');
      const response = await authAPI.verifyResetOTP({ phone, otp: otpCode });
      const data = response.data;
      
      if (data.success) {
        setResetToken(data.data.reset_token);
        setStep(3);
      } else {
        setError(data.message || 'Invalid reset code');
      }
    } catch (err) {
      setError(err.message || 'Invalid reset code');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword({
        reset_token: resetToken,
        new_password: newPassword
      });
      const data = response.data;
      
      if (data.success) {
        setSuccess('Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length < 8) return { text: 'Too short', color: 'text-red-500' };
    if (!/(?=.*[a-z])/.test(password)) return { text: 'Add lowercase', color: 'text-red-500' };
    if (!/(?=.*[A-Z])/.test(password)) return { text: 'Add uppercase', color: 'text-yellow-500' };
    if (!/(?=.*\d)/.test(password)) return { text: 'Add number', color: 'text-yellow-500' };
    if (!/(?=.*[@$!%*?&])/.test(password)) return { text: 'Add special char', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${step >= num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {step > num ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              {num < 3 && (
                <div className={`
                  flex-1 h-0.5 mx-2
                  ${step > num ? 'bg-primary-600' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Phone</span>
          <span>Verify</span>
          <span>Reset</span>
        </div>
      </div>

      {/* Back button */}
      {step > 1 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
      )}

      {/* Error/Success alerts */}
      {error && (
        <Alert type="error" message={error} className="mb-4" />
      )}
      {success && (
        <Alert type="success" message={success} className="mb-4" />
      )}

      {/* Step 1: Phone */}
      {step === 1 && (
        <div>
          <div className="text-center mb-6">
            <Mail className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Forgot Password?
            </h2>
            <p className="text-gray-600 mt-1">
              Enter your phone number to receive a reset code
            </p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              hint="Enter your Kenyan phone number"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={!phone || phone.length < 10}
            >
              Send Reset Code
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Remember your password? Sign in
            </button>
          </div>
        </div>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <div>
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Enter Reset Code
            </h2>
            <p className="text-gray-600 mt-1">
              We sent a 6-digit code to {phone}
            </p>
          </div>

          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={otp.join('').length !== 6}
            >
              Verify Code
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handlePhoneSubmit}
              className="text-sm text-primary-600 hover:text-primary-700"
              disabled={loading}
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </div>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <div>
          <div className="text-center mb-6">
            <CheckCircle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Set New Password
            </h2>
            <p className="text-gray-600 mt-1">
              Choose a strong password for your account
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              hint={newPassword && (
                <span className={getPasswordStrength(newPassword).color}>
                  {getPasswordStrength(newPassword).text}
                </span>
              )}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              Reset Password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
