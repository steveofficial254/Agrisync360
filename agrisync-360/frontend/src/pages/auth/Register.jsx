import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  MapPin, 
  Eye, 
  EyeOff,
  Sprout,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import authAPI from '../../api/auth';

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    
    // Step 2: Location
    county: '',
    subCounty: '',
    ward: '',
    village: '',
    
    // Step 3: Account
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false
  });

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 
    'Kajiado', 'Kiambu', 'Machakos', 'Kericho', 'Bungoma',
    'Uasin Gishu', 'Nandi', 'Trans Nzoia', 'Turkana', 'West Pokot',
    'Samburu', 'Laikipia', 'Nyandarua', 'Kirinyaga', 'Muranga',
    'Taita Taveta', 'Tana River', 'Lamu', 'Garissa', 'Wajir',
    'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Embu',
    'Kitui', 'Makueni', 'Kwale', 'Kilifi', 'Homabay',
    'Migori', 'Kisii', 'Nyamira', 'Siaya', 'Busia',
    'Baringo', 'Elgeyo Marakwet', 'Pokot'
  ];

  const validateStep = (step) => {
    setError('');
    
    switch (step) {
      case 1:
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        if (!/^(07|01)\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
          setError('Please enter a valid Kenyan phone number');
          return false;
        }
        return true;
        
      case 2:
        return true;
        
      case 3:
        if (!formData.password) {
          setError('Password is required');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (!formData.confirmPassword) {
          setError('Please confirm your password');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (!formData.agreeTerms) {
          setError('You must agree to the Terms of Service');
          return false;
        }
        if (!formData.agreePrivacy) {
          setError('You must agree to the Privacy Policy');
          return false;
        }
        return true;
        
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting registration with:', { phone: formData.phone, role: 'farmer' });
      
      // Call registration API
      const response = await authAPI.register({
        phone: formData.phone,
        password: formData.password,
        role: 'farmer'
      });
      
      console.log('Registration response:', response);
      
      const data = response.data;
      
      if (data.success) {
        let successMsg = 'Registration successful! Check your phone for OTP code.';
        if (data.data?.otp) {
          successMsg += ` (Dev OTP: ${data.data.otp})`;
          toast.success(`Dev OTP: ${data.data.otp}`, { duration: 10000 });
        }
        setSuccess(successMsg);
        // Store user data for OTP verification
        localStorage.setItem('registration_phone', formData.phone);
        
        // Redirect to OTP verification page after delay
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { 
              phone: formData.phone,
              message: 'Registration successful! Please enter the OTP sent to your phone.' 
            } 
          });
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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

  const renderStepIndicator = () => {
    const steps = ['Phone Number', 'Additional Info', 'Password'];
    
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                </div>
                <span
                  className={`ml-3 text-sm font-medium ${
                    isActive ? 'text-green-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-4 ${
                    currentStep > stepNumber ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-earth-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display mb-2">AgriSync 360</h1>
          <p className="text-gray-600">Create your farmer account</p>
        </div>

        <Card className="p-8">
          {/* Step Indicator */}
          {renderStepIndicator()}

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

          {/* Step 1: Phone Number */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Phone Number</h2>
                <p className="text-sm text-gray-600">Enter your Kenyan phone number for registration</p>
              </div>
              
              <Input
                label="Phone Number"
                placeholder="07XX XXX XXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                leftIcon="phone"
                required
                hint="Format: 07XX XXX XXX"
              />
            </div>
          )}

          {/* Step 2: Additional Information (Optional) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Additional Information</h2>
                <p className="text-sm text-gray-600">This information is optional and can be added later in your profile</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County
                </label>
                <select
                  value={formData.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select your county</option>
                  {counties.map((county, index) => (
                    <option key={`${county}-${index}`} value={county}>{county}</option>
                  ))}
                </select>
              </div>
              
              <Input
                label="Sub-County"
                placeholder="Enter your sub-county (optional)"
                value={formData.subCounty}
                onChange={(e) => handleInputChange('subCounty', e.target.value)}
                leftIcon="location"
              />
              
              <Input
                label="Ward"
                placeholder="Enter your ward (optional)"
                value={formData.ward}
                onChange={(e) => handleInputChange('ward', e.target.value)}
                leftIcon="location"
              />
              
              <Input
                label="Village/Area"
                placeholder="Enter your village or area (optional)"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                leftIcon="location"
              />
            </div>
          )}

          {/* Step 3: Account Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Setup</h2>
                <p className="text-sm text-gray-600">Create your secure account</p>
              </div>
              
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                leftIcon="password"
                showPasswordToggle
                required
                hint="Must be at least 8 characters with uppercase, lowercase, and numbers"
              />
              
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                leftIcon="password"
                showPasswordToggle
                required
              />
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Password Requirements:</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      formData.password.length >= 8 ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    At least 8 characters long
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      /[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    One uppercase letter
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      /[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    One lowercase letter
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      /\d/.test(formData.password) ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    One number
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                      Terms of Service
                    </a>
                  </span>
                </label>
              </div>
              
              <div className="flex items-start">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.agreePrivacy}
                    onChange={(e) => handleInputChange('agreePrivacy', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-300 hover:border-gray-400"
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isLoading}
                className="flex-1"
                rightIcon={<User className="w-4 h-4" />}
              >
                Create Account
              </Button>
            )}
          </div>
        </Card>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
