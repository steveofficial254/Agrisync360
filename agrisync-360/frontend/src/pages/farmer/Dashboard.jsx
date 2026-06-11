/**
 * AgriSync 360 — Professional Farmer Dashboard
 * Enterprise-grade UI with full functionality
 * Green gradient theme throughout
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Cloud, TrendingUp, Leaf, Droplets, AlertTriangle,
  CheckCircle, Calendar, DollarSign, Settings, Bell,
  ChevronRight, Plus, BarChart3, Eye, Zap, Home,
  BookOpen, Bug, Sparkles, MessageSquare, RefreshCw,
  ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'

// API imports
import { weatherAPI } from '../../api/weather'
import { marketAPI } from '../../api/market'
import { advisoryAPI } from '../../api/advisory'
import { paymentsAPI } from '../../api/payments'
import { farmersAPI } from '../../api/farmers'
import { financialAPI } from '../../api/financial'

const QuickActionButton = ({ icon: Icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center justify-center gap-3 p-6
               rounded-2xl border border-green-100 bg-gradient-to-br
               from-green-50 to-white hover:border-green-300
               hover:shadow-lg transition-all duration-300 w-full"
  >
    <div className="p-3 rounded-xl bg-gradient-green text-white
                    group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
    <div className="text-center">
      <p className="font-semibold text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-500 font-sans mt-0.5">{description}</p>
    </div>
  </button>
)

const StatCard = ({ icon: Icon, label, value, trend, color = 'green' }) => {
  const colorMap = {
    green: 'from-green-50 to-green-100 border-green-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
    red: 'from-red-50 to-red-100 border-red-200',
  }

  const iconColors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border
                    rounded-xl p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <Icon size={20} className={iconColors[color]} />
        {trend !== undefined && trend !== null && (
          <span className={`flex items-center gap-1 text-xs font-bold font-sans
                           ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 font-sans">{value}</p>
    </div>
  )
}

const CropCard = ({ crop, onViewDetails }) => (
  <div className="bg-white border border-green-100 rounded-xl p-4
                  shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="font-bold text-gray-900 capitalize">{crop.crop_name}</p>
        <p className="text-xs text-gray-500">{crop.variety || 'Default variety'}</p>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold font-sans
                       ${crop.status === 'growing'
                         ? 'bg-green-100 text-green-700'
                         : crop.status === 'harvested'
                         ? 'bg-amber-100 text-amber-700'
                         : 'bg-blue-100 text-blue-700'}`}>
        {crop.status}
      </span>
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex justify-between text-xs text-gray-600 font-sans">
        <span>{crop.area_planted_acres || crop.area_acres || '—'} acres</span>
        <span>{crop.days_to_harvest || '—'} days to harvest</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-green animate-pulse"
          style={{
            width: `${crop.progress_percent || 50}%`,
          }}
        />
      </div>
    </div>

    <button
      onClick={() => onViewDetails(crop.id)}
      className="w-full py-2 text-sm font-semibold text-green-600
                 hover:text-green-700 border border-green-200
                 rounded-lg hover:bg-green-50 transition-colors"
    >
      View Details →
    </button>
  </div>
)

const WeatherCard = ({ data, onViewMore }) => (
  <div className="bg-gradient-green rounded-2xl p-6 text-white shadow-lg
                  border border-green-600 flex flex-col justify-between min-h-[280px]">
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm opacity-90 mb-1">Current Weather</p>
          <p className="text-4xl font-bold font-sans">{data.temp}°C</p>
          <p className="text-sm opacity-75 mt-1 capitalize">{data.condition}</p>
        </div>
        <Cloud size={48} className="opacity-90" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
          <Droplets size={16} className="mb-1 opacity-75" />
          <p className="text-xs opacity-75">Humidity</p>
          <p className="font-bold text-sm font-sans">{data.humidity}%</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
          <Zap size={16} className="mb-1 opacity-75" />
          <p className="text-xs opacity-75">Wind</p>
          <p className="font-bold text-sm font-sans">{data.wind_speed} km/h</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
          <AlertTriangle size={16} className="mb-1 opacity-75" />
          <p className="text-xs opacity-75 font-sans">Disease Risk</p>
          <p className="font-bold text-sm capitalize font-sans">{data.disease_risk}</p>
        </div>
      </div>
    </div>

    <button
      onClick={onViewMore}
      className="w-full py-2.5 bg-white text-green-600 font-semibold
                 rounded-lg hover:bg-green-50 transition-colors
                 flex items-center justify-center gap-2 mt-auto"
    >
      View 7-Day Forecast
      <ChevronRight size={16} />
    </button>
  </div>
)

const AdvisoryCard = ({ advisory, onViewMore }) => {
  const categoryIcons = {
    disease: <Bug size={16} />,
    pest: <AlertTriangle size={16} />,
    general: <BookOpen size={16} />,
  }

  const categoryColors = {
    disease: 'bg-red-100 text-red-700',
    pest: 'bg-amber-100 text-amber-700',
    general: 'bg-blue-100 text-blue-700',
  }

  const category = advisory.category || (advisory.type?.includes('pest') || advisory.type?.includes('disease') ? 'pest' : 'general')

  return (
    <div className="bg-white border border-green-100 rounded-xl p-4 shadow-sm
                    hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
         onClick={onViewMore}>
      <div>
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg ${categoryColors[category] || 'bg-green-100 text-green-700'}`}>
            {categoryIcons[category] || <BookOpen size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {advisory.title || advisory.crop_name || 'Advisory'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{advisory.crop || advisory.crop_name || 'General'}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-bold font-sans capitalize
                           ${advisory.severity === 'high' || advisory.severity === 'very_high'
                             ? 'bg-red-100 text-red-700'
                             : 'bg-amber-100 text-amber-700'}`}>
            {advisory.severity || 'normal'}
          </span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
          {advisory.description || advisory.message || advisory.content || 'No details available.'}
        </p>
      </div>
      <p className="text-xs text-green-600 font-semibold mt-auto">
        Read full advisory →
      </p>
    </div>
  )
}

const getPlanBenefits = (sub) => {
  if (!sub || !sub.features) {
    return ["Access to weather forecasts", "Access to general market prices"];
  }
  
  const features = sub.features;
  const benefits = [];
  
  if (Array.isArray(features)) {
    return features;
  }
  
  if (features.weather_forecast) {
    benefits.push(`${features.weather_days || 3}-day weather forecast`);
  }
  if (features.crop_advisory) {
    benefits.push("Personalized crop advisory");
  }
  if (features.market_prices) {
    benefits.push("Real-time market prices");
  }
  if (features.sms_alerts) {
    benefits.push(features.sms_per_month === 999 ? "Unlimited SMS alerts" : `${features.sms_per_month} SMS alerts per month`);
  }
  if (features.disease_risk) {
    benefits.push("Disease & pest risk alerts");
  }
  if (features.planting_calendar) {
    benefits.push("Interactive planting calendar");
  }
  if (features.profitability_calc) {
    benefits.push("Profitability calculator");
  }
  
  return benefits.length > 0 ? benefits : ["Standard farmer features"];
};

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [farms, setFarms] = useState([])
  const [primaryFarm, setPrimaryFarm] = useState(null)
  const [crops, setCrops] = useState([])
  const [weather, setWeather] = useState(null)
  const [prices, setPrices] = useState([])
  const [advisories, setAdvisories] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [financials, setFinancials] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    loadDashboardData()
  }, [authLoading, isAuthenticated])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Load profile
      let loadedProfile = null
      try {
        const profileResp = await farmersAPI.getProfile()
        loadedProfile = profileResp.data?.data
        setProfile(loadedProfile)
      } catch (err) {
        console.warn('Failed to load profile:', err)
      }

      // 2. Load farms
      let farmsList = []
      try {
        const farmsResp = await farmersAPI.listFarms()
        farmsList = farmsResp.data?.data || []
        setFarms(farmsList)
        
        const primary = farmsList.find(f => f.is_primary) || farmsList[0] || null
        setPrimaryFarm(primary)
      } catch (err) {
        console.warn('Failed to load farms:', err)
      }

      // 3. Load crops for all farms
      try {
        let allCrops = []
        for (const farm of farmsList) {
          try {
            const cropsResp = await farmersAPI.listCrops(farm.id)
            const farmCrops = cropsResp.data?.data || []
            allCrops.push(...farmCrops.map(c => ({ ...c, farm_name: farm.name })))
          } catch (cropErr) {
            console.warn(`Failed to list crops for farm ${farm.id}:`, cropErr)
          }
        }
        setCrops(allCrops)
      } catch (err) {
        console.warn('Failed to compile crops list:', err)
      }

      // 4. Load weather
      try {
        const primary = farmsList.find(f => f.is_primary) || farmsList[0] || null
        const lat = primary?.latitude || loadedProfile?.latitude || -1.2921
        const lon = primary?.longitude || loadedProfile?.longitude || 36.8219
        
        const weatherResp = await weatherAPI.getForecast(lat, lon)
        const forecastData = weatherResp.data?.data?.forecast?.[0]
        const overallRisk = weatherResp.data?.data?.summary?.overall_disease_risk || 'low'
        
        setWeather({
          temp: Math.round(forecastData?.temperature_max || forecastData?.temp_max || 25),
          condition: forecastData?.description || forecastData?.weather_description || 'Partly cloudy',
          humidity: Math.round(forecastData?.humidity || forecastData?.humidity_percent || 70),
          wind_speed: Math.round(forecastData?.wind_speed || forecastData?.wind_speed_kmh || 10),
          disease_risk: overallRisk,
        })
      } catch (err) {
        console.warn('Failed to load weather forecast:', err)
      }

      // 5. Load market prices
      try {
        const pricesResp = await marketAPI.getPrices()
        setPrices(pricesResp.data?.data?.slice(0, 5) || [])
      } catch (err) {
        console.warn('Failed to load market prices:', err)
      }

      // 6. Load advisories
      try {
        let advisoriesList = []
        try {
          const advisoriesResp = await advisoryAPI.getMyCropsAdvisory()
          advisoriesList = advisoriesResp.data?.data || []
        } catch (myCropsErr) {
          const advisoriesResp = await advisoryAPI.getAll()
          advisoriesList = advisoriesResp.data?.data || []
        }
        setAdvisories(advisoriesList.slice(0, 3))
      } catch (err) {
        console.warn('Failed to load advisories:', err)
      }

      // 7. Load subscription
      try {
        const subResp = await paymentsAPI.getSubscription()
        setSubscription(subResp.data?.data)
      } catch (err) {
        console.warn('Failed to load subscription status:', err)
      }

      // 8. Load financials
      try {
        const finResp = await financialAPI.getDashboard()
        setFinancials(finResp?.data?.data)
      } catch (err) {
        console.warn('Failed to load financial summary:', err)
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Habari ya Asubuhi'
    if (hour < 17) return 'Habari ya Mchana'
    return 'Habari ya Jioni'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-7xl space-y-8 animate-pulse">
          <div className="h-16 bg-gray-200 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-gray-200 rounded-xl lg:col-span-2" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-16">
      {/* Header */}
      <div className="border-b border-green-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-display">
                {getGreeting()}, {profile?.first_name || 'Farmer'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 font-sans">
                {new Date().toLocaleDateString('en-US',
                  { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/farmer/weather')}
                className="relative p-2 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button
                onClick={loadDashboardData}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-sans flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadDashboardData}
              className="underline font-semibold hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Leaf}
            label="Active Crops"
            value={crops.length}
            color="green"
          />
          <StatCard
            icon={Calendar}
            label="Upcoming Tasks"
            value="3"
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="This Month Income"
            value={financials ? `KSH ${Math.round(financials.income_ksh / 1000)}K` : 'KSH 0K'}
            trend={12}
            color="amber"
          />
          <StatCard
            icon={AlertTriangle}
            label="Active Alerts"
            value={weather?.disease_risk === 'high' || weather?.disease_risk === 'very_high' ? '1' : '0'}
            color="red"
          />
        </div>

        {/* Farm Overview Hero */}
        <div className="bg-gradient-green rounded-2xl p-8 text-white shadow-lg border border-green-600">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm opacity-90 mb-2">My Primary Farm</p>
              <h2 className="text-3xl font-bold font-display mb-1">
                {primaryFarm?.name || 'Your Farm'}
              </h2>
              <p className="text-sm opacity-75 font-sans">
                {primaryFarm?.county || profile?.county || 'Kenya'}, {primaryFarm?.sub_county || profile?.sub_county || ''}
              </p>
            </div>
            <Home size={48} className="opacity-20" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs opacity-75 mb-1">Farm Size</p>
              <p className="text-2xl font-bold font-sans">{primaryFarm?.size_acres || '—'} acres</p>
            </div>
            <div>
              <p className="text-xs opacity-75 mb-1">Active Crops</p>
              <p className="text-2xl font-bold font-sans">{crops.length}</p>
            </div>
            <div>
              <p className="text-xs opacity-75 mb-1">Soil Type</p>
              <p className="text-2xl font-bold capitalize font-sans">{primaryFarm?.soil_type || 'Loamy'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/farmer/farm-setup" className="flex-1">
              <Button className="w-full bg-white text-green-600 hover:bg-green-50">
                Manage Farm
              </Button>
            </Link>
            <Link to="/farmer/farm-ops" className="flex-1">
              <button className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm
                               border-2 border-white/70 text-white hover:bg-white/20
                               transition-colors duration-200">
                View Operations
              </button>
            </Link>
          </div>
        </div>

        {/* Weather & Supporting Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            {weather ? (
              <WeatherCard
                data={weather}
                onViewMore={() => navigate('/farmer/weather')}
              />
            ) : (
              <Card className="h-full flex items-center justify-center p-6 text-gray-500">
                No weather forecast data available.
              </Card>
            )}
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-600 text-white rounded-lg">
                  <Cloud size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Intelligence Quick Links</h3>
              </div>

              <div className="space-y-2">
                {[
                  { icon: Cloud, label: 'Weather Details', path: '/farmer/weather' },
                  { icon: AlertTriangle, label: 'Disease Risks', path: '/farmer/weather' },
                  { icon: TrendingUp, label: 'Market Trends', path: '/farmer/market' },
                  { icon: BookOpen, label: 'Crop Advisory', path: '/farmer/advisory' },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-200 transition-colors text-left"
                  >
                    <action.icon size={18} className="text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">
                      {action.label}
                    </span>
                    <ChevronRight size={16} className="ml-auto text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Active Crops Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Leaf size={24} className="text-green-600" />
              Active Crops
            </h2>
            <Link to="/farmer/farm-ops">
              <Button size="sm" variant="secondary" rightIcon={<ChevronRight size={16} />}>
                View All
              </Button>
            </Link>
          </div>

          {crops.length === 0 ? (
            <Card className="p-12 text-center border border-green-100 bg-white">
              <Leaf size={48} className="text-gray-300 mx-auto mb-3 animate-pulse" />
              <p className="font-semibold text-gray-700 mb-2">No active crops yet</p>
              <p className="text-gray-500 text-sm mb-4 font-sans">
                Register a crop in your farm operations to track yield progress.
              </p>
              <Link to="/farmer/farm-ops">
                <Button leftIcon={<Plus size={16} />}>Add Crop</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.map(crop => (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  onViewDetails={(id) => navigate(`/farmer/farm-ops?crop=${id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Market Prices Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={24} className="text-amber-600" />
              Market Prices
            </h2>
            <Link to="/farmer/market">
              <Button size="sm" variant="secondary" rightIcon={<ChevronRight size={16} />}>
                All Prices
              </Button>
            </Link>
          </div>

          {prices.length === 0 ? (
            <Card className="p-6 text-center text-gray-500 bg-white border border-amber-100">
              No recent crop prices available.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {prices.map((price, index) => (
                <div key={price.id || index}
                  className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-4 shadow-sm
                             hover:shadow-md transition-shadow">
                  <p className="text-sm text-gray-600 mb-1 capitalize">
                    {price.crop_name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-2 font-sans">
                    KSH {price.price_per_kg}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-semibold font-sans">
                    {price.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {price.change || 0}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        {financials && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign size={24} className="text-green-600" />
                Financial Summary
              </h2>
              <Link to="/farmer/financials">
                <Button size="sm" variant="secondary" rightIcon={<ChevronRight size={16} />}>
                  View Details
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Income This Month</p>
                  <p className="text-2xl font-bold text-green-700 mt-2 font-sans">
                    KSH {financials.income_ksh?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-semibold font-sans">
                  <ArrowUpRight size={16} />
                  <span>On track</span>
                </div>
              </div>

              <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Expenses This Month</p>
                  <p className="text-2xl font-bold text-red-700 mt-2 font-sans">
                    KSH {financials.expenses_ksh?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-red-600 font-semibold font-sans">
                  <ArrowDownRight size={16} />
                  <span>Managed</span>
                </div>
              </div>

              <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Net Profit</p>
                  <p className={`text-2xl font-bold mt-2 font-sans ${financials.net_profit_ksh >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    KSH {financials.net_profit_ksh?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-semibold font-sans">
                  <CheckCircle size={16} />
                  <span>Healthy margin</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advisories Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={24} className="text-red-600" />
              Recent Advisories
            </h2>
            <Link to="/farmer/advisory">
              <Button size="sm" variant="secondary" rightIcon={<ChevronRight size={16} />}>
                View All
              </Button>
            </Link>
          </div>

          {advisories.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-red-100 text-gray-500">
              No recent crop advisories found.
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {advisories.map((advisory, idx) => (
                <AdvisoryCard
                  key={advisory.id || idx}
                  advisory={advisory}
                  onViewMore={() => navigate(`/farmer/advisory?id=${advisory.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <QuickActionButton
              icon={Cloud}
              label="Weather"
              description="7-day forecast"
              onClick={() => navigate('/farmer/weather')}
            />
            <QuickActionButton
              icon={BookOpen}
              label="Advisory"
              description="Crop guidance"
              onClick={() => navigate('/farmer/advisory')}
            />
            <QuickActionButton
              icon={TrendingUp}
              label="Market"
              description="Today's prices"
              onClick={() => navigate('/farmer/market')}
            />
            <QuickActionButton
              icon={DollarSign}
              label="Financials"
              description="P&L report"
              onClick={() => navigate('/farmer/financials')}
            />
            <QuickActionButton
              icon={Sparkles}
              label="AI Assistant"
              description="Expert advice"
              onClick={() => navigate('/farmer/ai-chat')}
            />
            <QuickActionButton
              icon={MessageSquare}
              label="Community"
              description="Farmer stories"
              onClick={() => navigate('/farmer/community')}
            />
            <QuickActionButton
              icon={Leaf}
              label="Soil Health"
              description="Test results"
              onClick={() => navigate('/farmer/soil-health')}
            />
            <QuickActionButton
              icon={Droplets}
              label="Irrigation"
              description="Water schedule"
              onClick={() => navigate('/farmer/irrigation')}
            />
          </div>
        </div>

        {/* Subscription Status Card */}
        {subscription && (
          <div className="bg-gradient-green rounded-2xl p-8 text-white shadow-xl border border-green-700">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm opacity-90 mb-1">Current Plan</p>
                <h3 className="text-2xl font-bold font-display uppercase tracking-wide">
                  {subscription.plan?.replace('_', ' ') || 'Free'}
                </h3>
                <p className="text-sm opacity-75 mt-1 font-sans">
                  {subscription.is_active ? `${subscription.days_remaining} days remaining` : 'No active paid subscription'}
                </p>
              </div>
              <CheckCircle size={32} className="text-green-300" />
            </div>

            <div className="mb-6">
              <p className="text-xs opacity-75 mb-2">Plan Benefits</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 font-sans">
                {getPlanBenefits(subscription).map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={14} className="text-green-300 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/farmer/subscription" className="flex-1">
                <Button className="w-full bg-white text-green-600 hover:bg-green-50">
                  Manage Plan
                </Button>
              </Link>
              <button 
                onClick={() => navigate('/farmer/subscription')}
                className="px-6 py-2.5 border-2 border-white/70 text-white
                           font-semibold rounded-lg hover:bg-white/10
                           transition-colors text-sm"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
