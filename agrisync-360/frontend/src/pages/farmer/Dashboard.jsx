/**
 * AgriSync 360 — Farmer Dashboard
 * Complete professional dashboard with real API data
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { farmersAPI } from '../../api/farmers'
import { weatherAPI } from '../../api/weather'
import { advisoryAPI } from '../../api/advisory'
import { marketAPI } from '../../api/market'
import { paymentsAPI } from '../../api/payments'
import {
  Cloud, Sun, CloudRain, Thermometer,
  TrendingUp, TrendingDown, Minus,
  BookOpen, Bell, ChevronRight,
  MapPin, Droplets, Wind, Eye,
  AlertTriangle, CheckCircle, Info,
  Plus, RefreshCw, ArrowRight,
  Leaf, ShoppingBag, CreditCard,
  Home, User, BarChart2, Zap,
  Calendar, Clock, Star, Award
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Habari ya Asubuhi', icon: '🌅' }
  if (hour < 17) return { text: 'Habari ya Mchana', icon: '☀️' }
  return { text: 'Habari ya Jioni', icon: '🌙' }
}

const getWeatherIcon = (code) => {
  if (code === undefined || code === null) return '🌡️'
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

const getCropEmoji = (cropName) => {
  const map = {
    maize: '🌽', beans: '🫘', potatoes: '🥔',
    tomatoes: '🍅', tea: '🍵', wheat: '🌾',
    cabbage: '🥬', kale: '🥦', onions: '🧅',
    sorghum: '🌾', cassava: '🍠', rice: '🌾',
  }
  return map[cropName?.toLowerCase()] || '🌱'
}

const getGrowthStageProgress = (stage) => {
  const stages = {
    land_prep: 5, germination: 15, vegetative: 35,
    flowering: 55, fruiting: 70, maturity: 85, harvested: 100,
  }
  return stages[stage] || 0
}

const getGrowthStageLabel = (stage) => {
  const labels = {
    land_prep: 'Land Prep', germination: 'Germination',
    vegetative: 'Vegetative', flowering: 'Flowering',
    fruiting: 'Fruiting', maturity: 'Maturity',
    harvested: 'Harvested',
  }
  return labels[stage] || stage || 'Unknown'
}

const getRiskConfig = (risk) => {
  const configs = {
    low: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Low Risk',
      icon: '✅',
    },
    medium: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
      dot: 'bg-amber-500',
      label: 'Medium Risk',
      icon: '⚠️',
    },
    high: {
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700',
      dot: 'bg-orange-500',
      label: 'High Risk',
      icon: '🚨',
    },
    very_high: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
      dot: 'bg-red-500',
      label: 'Very High Risk',
      icon: '🔴',
    },
  }
  return configs[risk] || configs.low
}

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  // ── State ──────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Data state
  const [profile, setProfile] = useState(null)
  const [farms, setFarms] = useState([])
  const [activeCrops, setActiveCrops] = useState([])
  const [weatherData, setWeatherData] = useState(null)
  const [advisories, setAdvisories] = useState([])
  const [marketPrices, setMarketPrices] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])

  // Error state per section
  const [errors, setErrors] = useState({
    profile: null,
    weather: null,
    crops: null,
    advisory: null,
    market: null,
    subscription: null,
  })

  const setError = (section, msg) => {
    setErrors(prev => ({ ...prev, [section]: msg }))
  }

  // ── Data Fetching ──────────────────────────────────────────
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    // Reset errors
    setErrors({
      profile: null, weather: null, crops: null,
      advisory: null, market: null, subscription: null,
    })

    // ── 1. Farmer Profile ────────────────────────────────────
    const fetchProfile = async () => {
      try {
        const resp = await farmersAPI.getProfile()
        const data = resp.data?.data
        if (data) {
          setProfile(data)
          return data
        }
      } catch (err) {
        if (err?.status === 404) {
          setError('profile', 'INCOMPLETE')
        } else if (err?.status !== 401) {
          setError('profile', 'Failed to load profile')
        }
      }
      return null
    }

    // ── 2. Farms & Crops ────────────────────────────────────
    const fetchFarmsAndCrops = async () => {
      try {
        const resp = await farmersAPI.listFarms()
        const farmsData = resp.data?.data || []
        setFarms(farmsData)

        // Get crops from all farms
        const allCrops = []
        for (const farm of farmsData) {
          try {
            const cropsResp = await farmersAPI.listCrops(farm.id)
            const farmCrops = (cropsResp.data?.data || [])
              .filter(c => c.is_active !== false)
              .map(c => ({ ...c, farm_name: farm.name }))
            allCrops.push(...farmCrops)
          } catch (cropErr) {
            console.warn(`Failed to get crops for farm ${farm.id}`)
          }
        }
        setActiveCrops(allCrops)
        return { farms: farmsData, crops: allCrops }
      } catch (err) {
        if (err?.status !== 401) {
          setError('crops', 'Failed to load farm data')
        }
        return { farms: [], crops: [] }
      }
    }

    // ── 3. Weather ──────────────────────────────────────────
    const fetchWeather = async (farmsData) => {
      try {
        // Use primary farm location or Nairobi default
        const primaryFarm = farmsData?.find(f => f.is_primary) ||
                            farmsData?.[0]
        const lat = primaryFarm?.latitude ?? -1.2921
        const lon = primaryFarm?.longitude ?? 36.8219

        const resp = await weatherAPI.getForecast(lat, lon)
        const data = resp.data?.data
        if (data) {
          setWeatherData(data)
        } else {
          setError('weather', 'No weather data available')
        }
      } catch (err) {
        console.error('[Dashboard] Weather error:', err)
        setError('weather', 'Unable to load weather')
      }
    }

    // ── 4. Advisories ────────────────────────────────────────
    const fetchAdvisories = async (cropsData) => {
      try {
        // Try my-crops endpoint first
        try {
          const resp = await advisoryAPI.getMyCropsAdvisory()
          const data = resp.data?.data || []
          if (data.length > 0) {
            setAdvisories(data.slice(0, 3))
            return
          }
        } catch (mycropsErr) {
          // Fall through to individual crop fetch
        }

        // Fallback: fetch advisory for first active crop
        const cropNames = cropsData?.length > 0
          ? [...new Set(cropsData.map(c => c.crop_name))]
          : ['maize']

        const firstCrop = cropNames[0]
        const resp = await advisoryAPI.getCropAdvisory(firstCrop)
        const data = resp.data?.data || []
        setAdvisories(data.slice(0, 3))

      } catch (err) {
        console.warn('[Dashboard] Advisory error:', err)
        setError('advisory', 'Failed to load advisories')
      }
    }

    // ── 5. Market Prices ────────────────────────────────────
    const fetchMarket = async () => {
      try {
        const resp = await marketAPI.getPrices()
        const data = resp.data?.data || []
        // Show top 5 most relevant prices
        setMarketPrices(data.slice(0, 5))
      } catch (err) {
        console.warn('[Dashboard] Market error:', err)
        // Try public endpoint as fallback
        try {
          const resp = await fetch('/api/market/prices')
          const data = await resp.json()
          setMarketPrices((data.data || []).slice(0, 5))
        } catch (e) {
          setError('market', 'Failed to load market prices')
        }
      }
    }

    // ── 6. Subscription ─────────────────────────────────────
    const fetchSubscription = async () => {
      try {
        const [subResp, plansResp] = await Promise.all([
          paymentsAPI.getSubscription(),
          paymentsAPI.getPlans(),
        ])
        setSubscription(subResp.data?.data || { is_active: false })
        setPlans(plansResp.data?.data || [])
      } catch (err) {
        console.warn('[Dashboard] Subscription error:', err)
        // Try plans at least
        try {
          const plansResp = await paymentsAPI.getPlans()
          setPlans(plansResp.data?.data || [])
        } catch (e) {}
        setSubscription({ is_active: false })
      }
    }

    // ── Execute all fetches ──────────────────────────────────
    try {
      // Profile first
      await fetchProfile()

      // Then farms and crops (depends on each other)
      const { farms: farmsData, crops: cropsData } =
        await fetchFarmsAndCrops()

      // Parallel fetches
      await Promise.all([
        fetchWeather(farmsData),
        fetchAdvisories(cropsData),
        fetchMarket(),
        fetchSubscription(),
      ])

      setLastUpdated(new Date())

    } catch (err) {
      console.error('[Dashboard] Critical error:', err)
      toast.error('Some data failed to load')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    fetchAllData()
  }, [authLoading, isAuthenticated, fetchAllData, navigate])

  // Handle view advisory click
  const handleViewAdvisory = (cropName) => {
    navigate(`/advisory?crop=${cropName}`)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchAllData(true)
    toast.success('Refreshing data...')
  }

  // ── Loading state ──────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded-xl w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded-xl w-48" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border
                                     border-gray-100 p-4 animate-pulse">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Weather skeleton */}
          <div className="bg-gray-200 rounded-3xl h-40 animate-pulse" />

          {/* Crops skeleton */}
          <div className="space-y-3">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            {[1,2].map(i => (
              <div key={i} className="bg-white rounded-2xl border p-4
                                     animate-pulse h-28" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Computed values ────────────────────────────────────────
  const greeting = getGreeting()
  const today = weatherData?.forecast?.[0]
  const next3Days = weatherData?.forecast?.slice(0, 4) || []
  const overallRisk = weatherData?.summary?.overall_disease_risk || 'low'
  const riskConfig = getRiskConfig(overallRisk)
  const hasPlantingWindow = weatherData?.summary?.planting_window_available
  const farmCount = farms.length
  const cropCount = activeCrops.length
  const planName = subscription?.plan?.replace('_', ' ').toUpperCase() || 'FREE'
  const primaryFarm = farms.find(f => f.is_primary) || farms[0]
  const basicPlan = plans.find(p => p.plan_id === 'basic_monthly')
  const proPlan = plans.find(p => p.plan_id === 'pro_monthly')

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── HEADER ──────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium flex
                          items-center gap-1.5">
              <span>{greeting.icon}</span>
              <span>{greeting.text}</span>
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5
                           font-display">
              {profile?.first_name
                ? `${profile.first_name} ${profile.last_name || ''}` 
                : user?.phone?.slice(-4)
                  ? `Farmer ****${user.phone.slice(-4)}` 
                  : 'Welcome!'
              }
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-10 h-10 bg-white rounded-xl border
                         border-gray-200 flex items-center justify-center
                         text-gray-500 hover:text-primary-600
                         hover:border-primary-300 transition-all
                         disabled:opacity-50 shadow-sm"
              title="Refresh data"
            >
              <RefreshCw size={16}
                className={refreshing ? 'animate-spin' : ''} />
            </button>

            {/* Notification button */}
            <Link to="/advisory">
              <button className="w-10 h-10 bg-white rounded-xl border
                                  border-gray-200 flex items-center
                                  justify-center text-gray-500
                                  hover:text-primary-600
                                  hover:border-primary-300 transition-all
                                  relative shadow-sm">
                <Bell size={16} />
                {advisories.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4
                                   bg-red-500 rounded-full
                                   flex items-center justify-center">
                    <span className="text-white text-2xs font-bold">
                      {advisories.length}
                    </span>
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>

        {/* ── INCOMPLETE PROFILE BANNER ─────────────────── */}
        {errors.profile === 'INCOMPLETE' && (
          <div className="bg-amber-50 border border-amber-200
                          rounded-2xl p-4 flex items-center
                          justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-900 text-sm">
                  Complete Your Profile
                </p>
                <p className="text-xs text-amber-700">
                  Add your farm details to get personalized advisories
                </p>
              </div>
            </div>
            <Link to="/profile">
              <button className="flex-shrink-0 text-xs font-bold
                                  text-amber-800 bg-amber-100
                                  hover:bg-amber-200 px-3 py-2
                                  rounded-xl transition-colors
                                  border border-amber-200">
                Setup →
              </button>
            </Link>
          </div>
        )}

        {/* ── SUBSCRIPTION BANNER ───────────────────────── */}
        {!subscription?.is_active && (
          <div className="relative overflow-hidden
                          bg-gradient-to-r from-primary-700
                          via-primary-600 to-primary-500
                          rounded-2xl p-4">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 text-6xl opacity-10
                            select-none -mt-2 -mr-2">🌾</div>

            <div className="relative flex items-center
                            justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl
                                flex items-center justify-center">
                  <Star size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    Upgrade to Basic
                  </p>
                  <p className="text-primary-100 text-xs mt-0.5">
                    Unlock advisories, market prices & SMS alerts
                  </p>
                </div>
              </div>
              <Link to="/subscription" className="flex-shrink-0">
                <button className="bg-white text-primary-700
                                    hover:bg-primary-50
                                    text-xs font-bold px-4 py-2.5
                                    rounded-xl transition-colors
                                    shadow-sm whitespace-nowrap">
                  KSH {basicPlan?.price_ksh || 99}/mo
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTION ACTIVE BADGE ─────────────────── */}
        {subscription?.is_active && (
          <div className="flex items-center justify-between
                          bg-white border border-primary-100
                          rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-primary-500 rounded-full
                              animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">
                {planName} Plan Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {subscription.days_remaining > 0 && (
                <span>{subscription.days_remaining} days left</span>
              )}
              <Link to="/subscription">
                <span className="text-primary-600 font-semibold
                                  hover:underline">
                  Manage →
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* ── STATS ROW ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-4 flex items-center gap-4
                          transition-all duration-200">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl
                            flex items-center justify-center
                            text-2xl">🌾</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase
                            tracking-wide truncate">
                My Farms
              </p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {farmCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {primaryFarm?.name || 'No farms yet'}
              </p>
            </div>
            <Link to="/profile">
              <ChevronRight size={16}
                className="ml-auto text-gray-300 flex-shrink-0" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-4 flex items-center gap-4
                          transition-all duration-200">
            <div className="w-12 h-12 bg-green-50 rounded-2xl
                            flex items-center justify-center
                            text-2xl">🌱</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase
                            tracking-wide truncate">
                Active Crops
              </p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {cropCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {cropCount > 0
                  ? `Across ${farmCount} farm${farmCount !== 1 ? 's' : ''}` 
                  : 'Add your first crop'
                }
              </p>
            </div>
            <Link to="/farms/setup">
              <ChevronRight size={16}
                className="ml-auto text-gray-300 flex-shrink-0" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-4 flex items-center gap-4
                          transition-all duration-200">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl
                            flex items-center justify-center
                            text-2xl">📊</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase
                            tracking-wide truncate">
                Plan
              </p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {subscription?.is_active ? planName : 'FREE'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {subscription?.is_active
                  ? `${subscription.days_remaining || 0} days left` 
                  : 'Upgrade for more'
                }
              </p>
            </div>
            <Link to="/subscription">
              <ChevronRight size={16}
                className="ml-auto text-gray-300 flex-shrink-0" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-4 flex items-center gap-4
                          transition-all duration-200">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl
                            flex items-center justify-center
                            text-2xl">📱</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase
                            tracking-wide truncate">
                USSD Access
              </p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                *384*360#
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Works on any phone
              </p>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ─────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3
                         flex items-center gap-2">
            <Zap size={18} className="text-green-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/weather">
              <div className="bg-white rounded-2xl border border-gray-100
                              shadow-sm p-4 flex flex-col items-center gap-2
                              text-center cursor-pointer
                              hover:-translate-y-1 hover:shadow-md
                              hover:border-primary-200
                              transition-all duration-200 active:scale-95">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl
                                flex items-center justify-center
                                text-3xl">🌤️</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Weather</p>
                  <p className="text-xs text-gray-400">7-day forecast</p>
                </div>
              </div>
            </Link>

            <Link to="/advisory">
              <div className="relative bg-white rounded-2xl border border-gray-100
                              shadow-sm p-4 flex flex-col items-center gap-2
                              text-center cursor-pointer
                              hover:-translate-y-1 hover:shadow-md
                              hover:border-primary-200
                              transition-all duration-200 active:scale-95">
                {advisories.length > 0 && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <div className="w-5 h-5 bg-red-500 rounded-full
                                    flex items-center justify-center">
                      <span className="text-white text-2xs font-bold">
                        {advisories.length}
                      </span>
                    </div>
                  </div>
                )}
                <div className="w-14 h-14 bg-primary-50 rounded-2xl
                                flex items-center justify-center
                                text-3xl">📋</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Advisory</p>
                  <p className="text-xs text-gray-400">Crop guidance</p>
                </div>
              </div>
            </Link>

            <Link to="/market">
              <div className="bg-white rounded-2xl border border-gray-100
                              shadow-sm p-4 flex flex-col items-center gap-2
                              text-center cursor-pointer
                              hover:-translate-y-1 hover:shadow-md
                              hover:border-primary-200
                              transition-all duration-200 active:scale-95">
                <div className="w-14 h-14 bg-green-50 rounded-2xl
                                flex items-center justify-center
                                text-3xl">📈</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Market</p>
                  <p className="text-xs text-gray-400">Today's prices</p>
                </div>
              </div>
            </Link>

            <Link to="/farms/setup">
              <div className="bg-white rounded-2xl border border-gray-100
                              shadow-sm p-4 flex flex-col items-center gap-2
                              text-center cursor-pointer
                              hover:-translate-y-1 hover:shadow-md
                              hover:border-primary-200
                              transition-all duration-200 active:scale-95">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl
                                flex items-center justify-center
                                text-3xl">🌾</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Add Farm</p>
                  <p className="text-xs text-gray-400">Setup your farm</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── MY CROPS ──────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900
                           flex items-center gap-2">
              <Leaf size={18} className="text-primary-500" />
              My Active Crops
              {cropCount > 0 && (
                <span className="text-xs font-semibold text-gray-400
                                  bg-gray-100 px-2 py-0.5 rounded-full">
                  {cropCount}
                </span>
              )}
            </h2>
            <Link to="/farms/setup">
              <button className="flex items-center gap-1 text-xs font-bold
                         text-primary-600 hover:text-primary-700
                         bg-primary-50 px-3 py-1.5 rounded-xl
                         border border-primary-100 transition-colors">
                <Plus size={12} />
                Add Crop
              </button>
            </Link>
          </div>

          {errors.crops ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl
                            p-4 text-center">
              <p className="text-red-600 text-sm">{errors.crops}</p>
            </div>
          ) : cropCount === 0 ? (
            <div className="bg-white border border-dashed border-gray-200
                            rounded-2xl p-8 text-center">
              <span className="text-4xl mb-3 block">🌱</span>
              <p className="text-gray-700 font-semibold text-sm mb-1">
                No Active Crops
              </p>
              <p className="text-gray-400 text-xs mb-4">
                Add your crops to get personalized advisories
                and growth tracking
              </p>
              <Link to="/farms/setup">
                <button className="bg-primary-600 text-white text-sm
                                    font-semibold px-5 py-2.5 rounded-xl
                                    hover:bg-primary-700 transition-colors">
                  Add Your First Crop
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCrops.slice(0, 4).map((crop, i) => (
                <div key={crop.id || i} className="bg-white rounded-2xl border border-gray-100
                                shadow-sm p-4 transition-all hover:border-primary-200
                                hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary-50 rounded-2xl
                                    flex items-center justify-center
                                    text-2xl flex-shrink-0">
                      {getCropEmoji(crop.crop_name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 capitalize text-sm">
                            {crop.crop_name}
                            {crop.variety && (
                              <span className="font-normal text-gray-400 ml-1">
                                ({crop.variety})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {crop.area_planted_acres} acres planted
                          </p>
                        </div>
                        <span className={`
                          flex-shrink-0 text-xs font-semibold px-2 py-1
                          rounded-full border
                          ${getGrowthStageProgress(crop.growth_stage) >= 80
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : getGrowthStageProgress(crop.growth_stage) >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-primary-50 text-primary-700 border-primary-200'
                          }
                        `}>
                          {getGrowthStageLabel(crop.growth_stage)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 mb-2">
                        <div className="flex items-center justify-between
                                        text-xs text-gray-400 mb-1.5">
                          <span>Growth Progress</span>
                          <span>{getGrowthStageProgress(crop.growth_stage)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000
                                       bg-gradient-to-r from-primary-500 to-primary-600"
                            style={{ width: `${getGrowthStageProgress(crop.growth_stage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Days info */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span>Planted {crop.days_since_planting || 0} days ago</span>
                        </div>
                        {crop.days_to_harvest > 0 && (
                          <div className="flex items-center gap-1 text-xs font-semibold
                                          text-primary-600">
                            <Clock size={11} />
                            <span>{crop.days_to_harvest}d to harvest</span>
                          </div>
                        )}
                      </div>

                      {/* Advisory button */}
                      <button
                        onClick={() => handleViewAdvisory(crop.crop_name)}
                        className="mt-3 w-full text-xs font-semibold text-primary-700
                                   bg-primary-50 hover:bg-primary-100 rounded-xl
                                   py-2 px-3 flex items-center justify-center gap-1.5
                                   transition-colors border border-primary-100">
                        <BookOpen size={12} />
                        View Advisory
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cropCount > 4 && (
                <Link to="/profile">
                  <button className="w-full py-3 text-sm font-semibold
                                      text-primary-600 border border-primary-100
                                      rounded-2xl hover:bg-primary-50
                                      transition-colors flex items-center
                                      justify-center gap-2">
                    View all {cropCount} crops
                    <ChevronRight size={16} />
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── LAST UPDATED FOOTER ──────────────────────── */}
        {lastUpdated && (
          <p className="text-center text-xs text-gray-400 pb-2">
            Last updated: {format(lastUpdated, 'h:mm a')}
            <button
              onClick={handleRefresh}
              className="ml-2 text-primary-600 hover:underline font-medium"
            >
              Refresh
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
