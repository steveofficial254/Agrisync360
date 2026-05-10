import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Sun, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Calendar,
  MapPin,
  User,
  CreditCard,
  BookOpen,
  ArrowLeft,
  Home,
  Settings,
  LogOut,
  ChevronDown,
  Leaf,
  Sprout,
  TreePine,
  Wheat,
  Tractor,
  Package,
  ShoppingCart,
  BarChart3,
  Activity,
  Thermometer,
  Wind as WindIcon,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import weatherAPI from '../../api/weather';
import farmersAPI from '../../api/farmers';
import paymentsAPI from '../../api/payments';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import { PageLoader, Spinner } from '../../components/common/Loader';
import OnboardingTour from '../../components/onboarding/OnboardingTour';

// Real Kenyan farm and crop images
const FARM_IMAGES = [
  'https://images.unsplash.com/photo-1625246332410-90b0a6b9b9f1?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&w=400', // Maize farm
  'https://images.unsplash.com/photo-1574944985070-8f3ebc3b2bf5?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&w=400', // Coffee plantation
  'https://images.unsplash.com/photo-1592982184089-0ad63d16d1c5?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&w=400', // Tea plantation
  'https://images.unsplash.com/photo-1589928411595-66d5bfa189e3?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&w=400', // Wheat field
];

const CROP_IMAGES = {
  maize: 'https://images.unsplash.com/photo-1592982184089-0ad63d16d1c5?w=400&h=300&fit=crop&crop=entropy&cs=tinysrgb&w=200',
  coffee: 'https://images.unsplash.com/photo-1574944985070-8f3ebc3b2bf5?w=400&h=300&fit=crop&crop=entropy&cs=tinysrgb&w=200',
  tea: 'https://images.unsplash.com/photo-1592982184089-0ad63d16d1c5?w=400&h=300&fit=crop&crop=entropy&cs=tinysrgb&w=200',
  wheat: 'https://images.unsplash.com/photo-1589928411595-66d5bfa189e3?w=400&h=300&fit=crop&crop=entropy&cs=tinysrgb&w=200',
  beans: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=entropy&cs=tinysrgb&w=200',
  potatoes: 'https://images.unsplash.com/photo-1518977626654-7046a3a1ce1d?w=400&h=300&fit=crop&crop=entropy&cs=tinysrgb&w=200',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const scrollContainerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [weather, setWeather] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [farms, setFarms] = useState([]);
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load profile data
      const profileRes = await farmersAPI.getProfile();
      if (profileRes.data?.success) {
        setProfile(profileRes.data.data);
        updateUser(profileRes.data.data);
      }

      // Load weather data (Nairobi coordinates as default)
      const weatherRes = await weatherAPI.getForecast(-1.2921, 36.8219);
      if (weatherRes.data?.success) {
        setWeather(weatherRes.data.data);
      }

      // Load subscription data
      const subRes = await paymentsAPI.getSubscription();
      if (subRes.data?.success) {
        setSubscription(subRes.data.data);
      }

      // Load farms data
      const farmsRes = await farmersAPI.getFarms();
      if (farmsRes.data?.success) {
        setFarms(farmsRes.data.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Habari za asubuhi';
    if (hour < 17) return 'Habari za mchana';
    return 'Habari za jioni';
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return { variant: 'info', text: 'Loading...' };
    
    if (subscription.is_active) {
      const plan = subscription.plan || 'free';
      if (plan.includes('pro')) return { variant: 'pro', text: 'Pro' };
      if (plan.includes('basic')) return { variant: 'basic', text: 'Basic' };
    }
    
    return { variant: 'info', text: 'Free' };
  };

  const navigateToSection = (section) => {
    navigate(`/${section}`);
  };

  const navigateBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Navigation Bar */}
      <nav className={`sticky top-0 z-50 bg-white shadow-lg transition-all duration-300 ${scrollY > 50 ? 'py-2' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateBack}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center">
                <Leaf className="w-6 h-6 text-green-600 mr-2" />
                <span className="text-xl font-bold text-green-800">AgriSync 360</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <User className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/logout')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onboarding Tour */}
        <OnboardingTour onComplete={() => console.log('Onboarding done!')} />

        {/* Header Section */}
        <div className={`transform transition-all duration-700 ease-out ${scrollY > 100 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-green-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-6 md:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-2">
                  {getGreeting()}, {profile?.first_name || user?.phone || 'Mkulima'}!
                </h1>
                <p className="text-green-600 text-lg">
                  Welcome back to your smart farming dashboard
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant={getSubscriptionBadge().variant} className="px-4 py-2">
                  {getSubscriptionBadge().text} Plan
                </Badge>
                {subscription?.upgrade_available && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => navigate('/subscription')}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 transform transition-all duration-500">
            <Alert
              type="error"
              message={error}
              dismissible
              onDismiss={() => setError('')}
            />
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transform transition-all duration-700 delay-100 ${scrollY > 200 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Farms</p>
                <p className="text-3xl font-bold text-green-900">{farms.length}</p>
                <p className="text-green-500 text-xs mt-1">Active this season</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Current Season</p>
                <p className="text-3xl font-bold text-green-900">Long Rains</p>
                <p className="text-green-500 text-xs mt-1">March - May 2024</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Profile Status</p>
                <p className="text-3xl font-bold text-green-900">
                  {profile?.first_name ? 'Complete' : 'Pending'}
                </p>
                <p className="text-green-500 text-xs mt-1">
                  {profile?.first_name ? 'All details updated' : 'Complete profile'}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Weather Card */}
        {weather && (
          <div className={`bg-white rounded-2xl shadow-xl p-8 mb-8 border border-green-100 transform transition-all duration-700 delay-200 ${scrollY > 300 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-900 flex items-center">
                <Cloud className="w-6 h-6 mr-2 text-green-600" />
                Weather Forecast
              </h2>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => navigate('/weather')}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              {weather.forecast?.slice(0, 7).map((day, index) => (
                <div
                  key={index}
                  className={`
                    text-center p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg
                    ${index === 0 ? 'border-green-500 bg-green-50' : 'border-green-200 bg-white'}
                  `}
                >
                  <p className="text-xs text-green-600 mb-2 font-medium">
                    {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </p>
                  <div className="text-3xl mb-2">
                    {day.weather_description?.includes('rain') ? '🌧️' : 
                     day.weather_description?.includes('sun') ? '☀️' : 
                     day.weather_description?.includes('cloud') ? '☁️' : '🌤️'}
                  </div>
                  <p className="text-sm font-bold text-green-900">
                    {day.temperature_max}°/{day.temperature_min}°
                  </p>
                  {day.disease_risk && (
                    <div className="mt-2">
                      <Badge 
                        variant={day.disease_risk === 'high' ? 'danger' : 
                                 day.disease_risk === 'medium' ? 'warning' : 'success'}
                        size="sm"
                      >
                        {day.disease_risk} risk
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {weather.forecast?.[0]?.planting_window && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center">
                  <Droplets className="w-6 h-6 text-green-600 mr-3" />
                  <p className="text-green-800 font-medium">
                    {weather.forecast[0].planting_window}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 mb-8 border border-green-100 transform transition-all duration-700 delay-300 ${scrollY > 400 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
          <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-green-600" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Button
              variant="outline"
              className="h-24 p-4 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-500 hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/farm-setup')}
            >
              <Tractor className="w-8 h-8 mb-2 text-green-600" />
              <span className="font-medium text-green-800">Add Farm</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 p-4 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-500 hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/weather')}
            >
              <Thermometer className="w-8 h-8 mb-2 text-blue-600" />
              <span className="font-medium text-green-800">Weather</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 p-4 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-500 hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/advisory')}
            >
              <Sprout className="w-8 h-8 mb-2 text-green-600" />
              <span className="font-medium text-green-800">Advisory</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 p-4 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-500 hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/market')}
            >
              <BarChart3 className="w-8 h-8 mb-2 text-purple-600" />
              <span className="font-medium text-green-800">Market</span>
            </Button>
          </div>
        </div>

        {/* Recent Farms */}
        {farms.length > 0 && (
          <div className={`bg-white rounded-2xl shadow-xl p-8 mb-8 border border-green-100 transform transition-all duration-700 delay-400 ${scrollY > 500 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-900 flex items-center">
                <TreePine className="w-6 h-6 mr-2 text-green-600" />
                Your Farms
              </h2>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => navigate('/farm-setup')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add New Farm
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.slice(0, 6).map((farm, index) => (
                <div
                  key={farm.id}
                  className="group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate(`/farms/${farm.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={FARM_IMAGES[index % FARM_IMAGES.length]}
                      alt={farm.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    {farm.is_primary && (
                      <Badge variant="success" className="absolute top-3 right-3">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-green-900 mb-1">{farm.name}</h3>
                    <p className="text-green-600 text-sm mb-2">
                      {farm.size_acres} acres • {farm.county}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="info" size="sm">
                        {farm.crop_type || 'Mixed Crops'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/farms/${farm.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {farms.length > 6 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => navigate('/farms')}
                >
                  View All Farms ({farms.length})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Profile Completion Alert */}
        {!profile?.first_name && (
          <div className={`transform transition-all duration-700 delay-500 ${scrollY > 600 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <Alert
              type="info"
              title="Complete Your Profile"
              message="Add your farm details to get personalized weather forecasts and recommendations."
            >
              <Button
                className="bg-green-600 hover:bg-green-700 text-white mt-3"
                onClick={() => navigate('/profile')}
              >
                <User className="w-4 h-4 mr-1" />
                Complete Profile
              </Button>
            </Alert>
          </div>
        )}

        {/* Subscription Prompt */}
        {subscription && !subscription.is_active && (
          <div className={`transform transition-all duration-700 delay-600 ${scrollY > 700 ? 'translate-y-4 opacity-90' : 'translate-y-0 opacity-100'}`}>
            <Alert
              type="warning"
              title="Upgrade Your Plan"
              message="Get real-time market prices, complete crop advisory, and disease risk alerts."
            >
              <Button
                className="bg-green-600 hover:bg-green-700 text-white mt-3"
                onClick={() => navigate('/subscription')}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                View Plans
              </Button>
            </Alert>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          onClick={() => navigate('/farm-setup')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
