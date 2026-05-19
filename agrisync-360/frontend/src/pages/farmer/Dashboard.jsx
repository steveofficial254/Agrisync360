/**
 * AgriSync 360 — Farmer Dashboard
 * Complete professional dashboard with real API data
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import Footer from '../../components/common/Footer'
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
  AlertTriangle, CheckCircle, Info, Check,
  Plus, RefreshCw, ArrowRight,
  Leaf, ShoppingBag, CreditCard,
  Home, User, BarChart2, Zap,
  Calendar, Clock, Star, Award,
  Moon, Sunrise, Wheat, Snowflake,
  Ruler, Globe, Smartphone, FileText,
  XCircle, Shield, Trash2, TreePine, Crown
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
  if (hour < 12) return { text: 'Habari ya Asubuhi', icon: <Sunrise size={24} className="text-amber-500" /> }
  if (hour < 17) return { text: 'Habari ya Mchana', icon: <Sun size={24} className="text-orange-500" /> }
  return { text: 'Habari ya Jioni', icon: <Moon size={24} className="text-indigo-500" /> }
}

const getWeatherIcon = (code) => {
  if (code === undefined || code === null) return <Thermometer size={48} className="text-gray-400" />
  if (code === 0) return <Sun size={48} className="text-amber-400" />
  if (code <= 2) return <Cloud size={48} className="text-blue-300" />
  if (code === 3) return <Cloud size={48} className="text-gray-400" />
  if (code <= 48) return <Wind size={48} className="text-gray-300" />
  if (code <= 67) return <CloudRain size={48} className="text-blue-400" />
  if (code <= 77) return <Snowflake size={48} className="text-cyan-300" />
  if (code <= 82) return <CloudRain size={48} className="text-blue-300" />
  return <Zap size={48} className="text-purple-400" />
}

const getCropIcon = (cropName) => {
  const name = cropName?.toLowerCase() || ''
  const cls = "text-primary-600"
  if (['maize', 'wheat', 'sorghum', 'rice'].includes(name)) return <Wheat size={24} className={cls} />
  if (name === 'tea') return <TreePine size={24} className={cls} />
  if (['beans', 'potatoes', 'tomatoes', 'cassava', 'cabbage', 'kale', 'onions'].includes(name)) return <Leaf size={24} className={cls} />
  return <Leaf size={24} className={cls} />
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
      icon: <CheckCircle size={20} className="text-emerald-600" />,
    },
    medium: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
      dot: 'bg-amber-500',
      label: 'Medium Risk',
      icon: <AlertTriangle size={20} className="text-amber-600" />,
    },
    high: {
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700',
      dot: 'bg-orange-500',
      label: 'High Risk',
      icon: <AlertTriangle size={20} className="text-orange-600" />,
    },
    very_high: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
      dot: 'bg-red-500',
      label: 'Very High Risk',
      icon: <XCircle size={20} className="text-red-600" />,
    },
  }
  return configs[risk] || configs.low
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Skeleton loader for sections
function SectionSkeleton({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 bg-gray-200 rounded-xl w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i}
          className="h-4 bg-gray-100 rounded-xl"
          style={{ width: `${90 - i * 10}%` }}
        />
      ))}
    </div>
  )
}

// Stat card for the stats row
function StatCard({ icon, label, value, sub, color, to }) {
  const content = (
    <div className={`
      rounded-2xl border p-4 flex items-center gap-4
      transition-all duration-200 
      ${to ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}
      bg-white border-gray-100 shadow-sm
    `}>
      <div className={`
        w-12 h-12 rounded-2xl flex items-center
        justify-center text-2xl flex-shrink-0 ${color}
      `}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase
                      tracking-wide truncate">
          {label}
        </p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
        )}
      </div>
      {to && (
        <ChevronRight size={16}
          className="ml-auto text-gray-300 flex-shrink-0" />
      )}
    </div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }
  return content
}

// Quick action button
function QuickAction({ icon, label, sublabel, to, color, badge }) {
  return (
    <Link to={to}>
      <div className="relative bg-white rounded-2xl border border-gray-100
                      shadow-sm p-4 flex flex-col items-center gap-2
                      text-center cursor-pointer
                      hover:-translate-y-1 hover:shadow-md
                      hover:border-primary-200
                      transition-all duration-200 active:scale-95">
        {badge && (
          <div className="absolute -top-1.5 -right-1.5">
            <div className="w-5 h-5 bg-red-500 rounded-full
                            flex items-center justify-center">
              <span className="text-white text-2xs font-bold">
                {badge}
              </span>
            </div>
          </div>
        )}
        <div className={`
          w-14 h-14 rounded-2xl flex items-center
          justify-center text-3xl ${color}
        `}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
        </div>
      </div>
    </Link>
  )
}

// Crop card component
function CropCard({ crop, onViewAdvisory }) {
  const progress = getGrowthStageProgress(crop.growth_stage)
  const daysLeft = crop.days_to_harvest

  return (
    <div className="bg-white rounded-2xl border border-gray-100
                    shadow-sm p-4 transition-all hover:border-primary-200
                    hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary-50 rounded-2xl
                        flex items-center justify-center
                        text-2xl flex-shrink-0">
          {getCropIcon(crop.crop_name)}
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
              ${progress >= 80
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : progress >= 50
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
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000
                           bg-gradient-to-r from-primary-500 to-primary-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Days info */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar size={12} />
              <span>Planted {crop.days_since_planting || 0} days ago</span>
            </div>
            {daysLeft > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold
                              text-primary-600">
                <Clock size={11} />
                <span>{daysLeft}d to harvest</span>
              </div>
            )}
          </div>

          {/* Advisory button */}
          <button
            onClick={() => onViewAdvisory(crop.crop_name)}
            className="mt-3 w-full text-xs font-semibold text-primary-700
                       bg-primary-50 hover:bg-primary-100 rounded-xl
                       py-2 px-3 flex items-center justify-center gap-1.5
                       transition-colors border border-primary-100"
          >
            <BookOpen size={12} />
            View Advisory
          </button>
        </div>
      </div>
    </div>
  )
}

// Weather day card
function WeatherDayCard({ day, isToday }) {
  const riskDots = {
    low: 'bg-emerald-400',
    medium: 'bg-amber-400',
    high: 'bg-orange-500',
    very_high: 'bg-red-500',
  }

  return (
    <div className={`
      flex-shrink-0 w-[88px] rounded-2xl p-3 text-center
      transition-all duration-200 border
      ${isToday
        ? 'bg-gradient-to-b from-primary-600 to-primary-700 text-white border-primary-700 shadow-lg'
        : 'bg-white text-gray-700 border-gray-100 hover:border-primary-200'
      }
    `}>
      <p className={`text-xs font-bold mb-1.5 ${
        isToday ? 'text-primary-100' : 'text-gray-400'
      }`}>
        {isToday ? 'Today' : format(new Date(day.date), 'EEE')}
      </p>
      <div className="text-3xl mb-2 leading-none">
        {getWeatherIcon(day.weather_code)}
      </div>
      <p className={`text-base font-bold leading-none ${
        isToday ? 'text-white' : 'text-gray-900'
      }`}>
        {Math.round(day.temp_max ?? 0)}°
      </p>
      <p className={`text-xs mt-0.5 ${
        isToday ? 'text-primary-200' : 'text-gray-400'
      }`}>
        {Math.round(day.temp_min ?? 0)}°
      </p>
      <p className={`text-xs mt-1.5 font-medium ${
        isToday ? 'text-primary-100' : 'text-blue-600'
      }`}>
        {(day.precipitation_mm ?? 0).toFixed(0)}mm
      </p>
      <div className="flex justify-center mt-2">
        <div className={`
          w-2 h-2 rounded-full
          ${riskDots[day.disease_risk] || 'bg-emerald-400'}
        `} />
      </div>
    </div>
  )
}

// Market price row
function MarketPriceRow({ item, index }) {
  const trend = item.trend || 'stable'
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    stable: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50' },
  }
  const { icon: TrendIcon, color, bg } = trendConfig[trend]

  return (
    <div className={`
      flex items-center gap-3 py-3
      ${index > 0 ? 'border-t border-gray-50' : ''}
    `}>
      <div className="w-8 h-8 bg-primary-50 rounded-xl
                      flex items-center justify-center
                      text-lg flex-shrink-0">
        {getCropIcon(item.crop_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 capitalize">
          {item.crop_name}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {item.county} — {item.market_name}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">
          KSH {(item.price_per_kg ?? 0).toFixed(0)}
          <span className="text-xs font-normal text-gray-400">/kg</span>
        </p>
        <div className={`
          inline-flex items-center gap-1 text-xs font-semibold
          px-2 py-0.5 rounded-full mt-0.5 ${bg} ${color}
        `}>
          <TrendIcon size={10} />
          {trend}
        </div>
      </div>
    </div>
  )
}

// Alert/Advisory card
function AlertCard({ advisory }) {
  const typeConfig = {
    disease_alert: {
      icon: <AlertTriangle size={18} className="text-red-600" />, bg: 'bg-red-50', border: 'border-red-100',
      text: 'text-red-700', title: 'Disease Alert'
    },
    weather_alert: {
      icon: <Zap size={18} className="text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-100',
      text: 'text-blue-700', title: 'Weather Alert'
    },
    planting: {
      icon: <Leaf size={18} className="text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100',
      text: 'text-emerald-700', title: 'Planting Advisory'
    },
    spray: {
      icon: <Shield size={18} className="text-purple-600" />, bg: 'bg-purple-50', border: 'border-purple-100',
      text: 'text-purple-700', title: 'Spray Advisory'
    },
    pest: {
      icon: <AlertTriangle size={18} className="text-amber-600" />, bg: 'bg-amber-50', border: 'border-amber-100',
      text: 'text-amber-700', title: 'Pest Alert'
    },
    harvest: {
      icon: <Wheat size={18} className="text-primary-600" />, bg: 'bg-primary-50', border: 'border-primary-100',
      text: 'text-primary-700', title: 'Harvest Advisory'
    },
    default: {
      icon: <FileText size={18} className="text-gray-600" />, bg: 'bg-gray-50', border: 'border-gray-100',
      text: 'text-gray-700', title: 'Advisory'
    },
  }
  const config = typeConfig[advisory.type] || typeConfig.default

  return (
    <div className={`rounded-2xl border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.text}`}>
            {config.title}
          </p>
          <p className="text-sm text-gray-700 mt-1 leading-relaxed line-clamp-2">
            {advisory.message || advisory.content?.slice(0, 120)}...
          </p>
        </div>
      </div>
    </div>
  )
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
  const fetchingRef = useRef(false)

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

  // Delete farm modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Data Fetching ──────────────────────────────────────────
  const fetchAllData = useCallback(async (silent = false) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    
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
        
        let advisoriesList = []
        if (Array.isArray(data)) {
          advisoriesList = data
        } else if (data) {
          if (data.planting) advisoriesList.push(data.planting)
          if (data.nutrition) advisoriesList.push(data.nutrition)
          if (data.pests && Array.isArray(data.pests)) advisoriesList.push(...data.pests)
          if (data.harvest) advisoriesList.push(data.harvest)
        }
        
        setAdvisories(advisoriesList.slice(0, 3))

      } catch (err) {
        console.warn('[Dashboard] Advisory error:', err)
        if (err?.status === 402) {
          setError('advisory', 'Subscription required for personalized advisories')
        } else {
          setError('advisory', 'Failed to load advisories')
        }
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
      fetchingRef.current = false
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

  // Handle delete farm
  const handleDeleteFarm = async () => {
    if (!primaryFarm?.id) return
    try {
      await farmersAPI.deleteFarm(primaryFarm.id)
      toast.success('Farm deleted successfully')
      setShowDeleteConfirm(false)
      fetchAllData(true)
    } catch (err) {
      console.error('Delete farm error:', err)
      toast.error('Failed to delete farm')
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium flex
                          items-center gap-2">
              <span className="flex-shrink-0">{greeting.icon}</span>
              <span>{greeting.text}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1
                           font-display">
              {profile?.first_name
                ? `${profile.first_name} ${profile.last_name || ''}`
                : user?.phone?.slice(-4)
                  ? `Farmer ****${user.phone.slice(-4)}`
                  : 'Welcome!'
              }
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              <AlertTriangle size={24} className="text-amber-500" />
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
            <div className="absolute top-0 right-0 opacity-10
                            select-none -mt-2 -mr-2">
              <Wheat size={80} className="text-white" />
            </div>

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

        {/* ── MAIN DASHBOARD GRID ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* WEATHER CARD - LARGE */}
          <div className="lg:col-span-1">
            <div className="h-full min-h-[320px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-2xl border border-blue-200/30 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Cloud size={28} />
                  Weather Today
                </h3>
                <Link to="/weather" className="text-blue-100 hover:text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                  7-day forecast →
                </Link>
              </div>
              
              {errors.weather ? (
                <div className="text-center py-12">
                  <Cloud size={64} className="text-blue-200 mx-auto mb-4" />
                  <p className="text-blue-100">{errors.weather}</p>
                </div>
              ) : today ? (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-blue-100 text-lg mb-2 font-medium">
                          {primaryFarm?.name || 'My Farm'}
                        </p>
                        <p className="text-8xl font-bold mb-3">
                          {Math.round(today.temperature_max || 25)}°
                        </p>
                        <p className="text-blue-100 text-lg">
                          {today.weather_description || 'Clear'}
                        </p>
                      </div>
                      <div className="text-6xl opacity-20">
                        {getWeatherIcon(today.weather_code)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                        <Droplets size={24} className="mx-auto mb-2 text-blue-200" />
                        <p className="text-blue-200 text-sm">Humidity</p>
                        <p className="font-bold text-xl">{today.humidity || 65}%</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                        <Wind size={24} className="mx-auto mb-2 text-blue-200" />
                        <p className="text-blue-200 text-sm">Wind</p>
                        <p className="font-bold text-xl">{today.wind_speed || 10} km/h</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                        <CloudRain size={24} className="mx-auto mb-2 text-blue-200" />
                        <p className="text-blue-200 text-sm">Rain</p>
                        <p className="font-bold text-xl">{today.precipitation_mm || 0} mm</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Cloud size={64} className="text-blue-200 mx-auto mb-4" />
                  <p className="text-blue-100 text-lg">Loading weather...</p>
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS CARD - LARGE */}
          <div className="lg:col-span-1">
            <div className="h-full min-h-[320px] bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 rounded-3xl p-6 text-white shadow-2xl border border-emerald-200/30 backdrop-blur-xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Zap size={28} />
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Link to="/weather" className="group">
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/30 transition-all transform hover:scale-105">
                    <Cloud size={32} className="mx-auto mb-3" />
                    <p className="text-base font-medium">Weather</p>
                    <p className="text-emerald-100 text-sm mt-1">7-day forecast</p>
                  </div>
                </Link>
                <Link to="/advisory" className="group relative">
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/30 transition-all transform hover:scale-105">
                    <BookOpen size={32} className="mx-auto mb-3" />
                    <p className="text-base font-medium">Advisory</p>
                    <p className="text-emerald-100 text-sm mt-1">Crop guidance</p>
                    {advisories.length > 0 && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold">
                        {advisories.length}
                      </span>
                    )}
                  </div>
                </Link>
                <Link to="/market" className="group">
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/30 transition-all transform hover:scale-105">
                    <TrendingUp size={32} className="mx-auto mb-3" />
                    <p className="text-base font-medium">Market</p>
                    <p className="text-emerald-100 text-sm mt-1">Today's prices</p>
                  </div>
                </Link>
                <Link to="/farm-setup" className="group">
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/30 transition-all transform hover:scale-105">
                    <Home size={32} className="mx-auto mb-3" />
                    <p className="text-base font-medium">Add Farm</p>
                    <p className="text-emerald-100 text-sm mt-1">Setup farm</p>
                  </div>
                </Link>
              </div>
              
              <div className="mt-8 bg-white/10 backdrop-blur rounded-2xl p-4">
                <p className="text-sm font-medium mb-2">Recent Activity</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                    <span className="text-emerald-100">Weather updated 2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                    <span className="text-emerald-100">3 new advisories available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CROP STATUS CARD - LARGE */}
          <div className="lg:col-span-1">
            <div className="h-full min-h-[320px] bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-700 rounded-3xl p-6 text-white shadow-2xl border border-orange-200/30 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Leaf size={28} />
                  My Crops
                </h3>
                <Link to="/farm-setup" className="text-orange-100 hover:text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                  Add Crop →
                </Link>
              </div>
              
              {cropCount === 0 ? (
                <div className="text-center py-12">
                  <Leaf size={64} className="text-orange-200 mx-auto mb-4" />
                  <p className="text-orange-100 text-lg mb-4">No active crops yet</p>
                  <Link to="/farm-setup">
                    <button className="bg-white text-orange-600 px-6 py-3 rounded-2xl text-base font-semibold hover:bg-orange-50 transition-colors transform hover:scale-105">
                      Add Your First Crop
                    </button>
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="text-5xl font-bold mb-3">{cropCount}</div>
                  <p className="text-orange-100 text-lg mb-6">Active crops</p>
                  
                  <div className="space-y-3">
                    {activeCrops.slice(0, 4).map((crop, i) => (
                      <div key={crop.id || i} className="bg-white/20 backdrop-blur rounded-2xl p-4 flex items-center gap-4 hover:bg-white/30 transition-all">
                        <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center">
                          {getCropIcon(crop.crop_type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-base">{crop.crop_type}</p>
                          <p className="text-orange-100 text-sm">{crop.status || 'Growing'}</p>
                        </div>
                        <ChevronRight size={20} className="text-orange-200" />
                      </div>
                    ))}
                  </div>
                  
                  {cropCount > 4 && (
                    <Link to="/profile" className="block mt-6 text-center text-orange-100 hover:text-white text-base font-medium">
                      View all {cropCount} crops →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MARKET PRICES CARD - LARGE */}
          <div className="lg:col-span-1">
            <div className="h-full min-h-[320px] bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-2xl border border-purple-200/30 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <TrendingUp size={28} />
                  Market Prices
                </h3>
                <Link to="/market" className="text-purple-100 hover:text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                  All Prices →
                </Link>
              </div>
              
              {errors.market ? (
                <div className="text-center py-12">
                  <BarChart2 size={64} className="text-purple-200 mx-auto mb-4" />
                  <p className="text-purple-100">{errors.market}</p>
                </div>
              ) : marketPrices.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart2 size={64} className="text-purple-200 mx-auto mb-4" />
                  <p className="text-purple-100 text-lg">Loading market prices...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {marketPrices.slice(0, 5).map((item, i) => (
                    <div key={item.id || i} className="bg-white/20 backdrop-blur rounded-2xl p-4 flex items-center justify-between hover:bg-white/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center">
                          {getCropIcon(item.commodity)}
                        </div>
                        <div>
                          <p className="font-semibold text-base">{item.commodity}</p>
                          <p className="text-purple-100 text-sm">{item.market}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">KES {item.price}</p>
                        <p className="text-purple-100 text-sm">per {item.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ADVISORIES CARD - LARGE */}
          <div className="lg:col-span-1">
            <div className="h-full min-h-[320px] bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 rounded-3xl p-6 text-white shadow-2xl border border-red-200/30 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <BookOpen size={28} />
                  Advisories
                </h3>
                <Link to="/advisory" className="text-red-100 hover:text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                  All Advisories →
                </Link>
              </div>
              
              {errors.advisory ? (
                <div className="text-center py-12">
                  <FileText size={64} className="text-red-200 mx-auto mb-4" />
                  <p className="text-red-100">{errors.advisory}</p>
                </div>
              ) : advisories.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={64} className="text-red-200 mx-auto mb-4" />
                  <p className="text-red-100 text-lg">No advisories available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {advisories.slice(0, 4).map((adv, i) => (
                    <div key={adv.id || i} className="bg-white/20 backdrop-blur rounded-2xl p-4 hover:bg-white/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-base mb-2">{adv.title}</p>
                          <p className="text-red-100 text-sm line-clamp-3">{adv.content}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                              {adv.type || 'General'}
                            </span>
                            <span className="text-red-200 text-xs">
                              {new Date(adv.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SUBSCRIPTION CARD - LARGE */}
          <div className="lg:col-span-1">
            <div className="h-full min-h-[320px] bg-gradient-to-br from-gray-700 via-slate-800 to-zinc-900 rounded-3xl p-6 text-white shadow-2xl border border-gray-200/30 backdrop-blur-xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Crown size={28} />
                Subscription
              </h3>
              
              <div className="text-center">
                <div className="text-5xl font-bold mb-3">
                  {subscription?.is_active ? planName : 'FREE'}
                </div>
                <p className="text-gray-300 text-lg mb-6">
                  {subscription?.is_active 
                    ? `${subscription.days_remaining || 0} days remaining`
                    : 'Upgrade for premium features'
                  }
                </p>
                
                {!subscription?.is_active && (
                  <div className="space-y-4">
                    <Link to="/subscription">
                      <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-4 rounded-2xl font-bold hover:from-yellow-300 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg">
                        Upgrade to Premium
                      </button>
                    </Link>
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                      <p className="text-sm text-gray-300">Get unlimited access to all features</p>
                    </div>
                  </div>
                )}
                
                {subscription?.is_active && (
                  <div className="space-y-3">
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                      <p className="font-semibold mb-3">Premium Benefits</p>
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                          <Check size={20} className="text-green-400 flex-shrink-0" />
                          <span className="text-base">Unlimited advisories</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check size={20} className="text-green-400 flex-shrink-0" />
                          <span className="text-base">Advanced weather analytics</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check size={20} className="text-green-400 flex-shrink-0" />
                          <span className="text-base">Market insights & trends</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check size={20} className="text-green-400 flex-shrink-0" />
                          <span className="text-base">Priority support</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        
        
        
        
        {/* ── FARM LOCATION ─────────────────────────────── */}
        {primaryFarm && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900
                             flex items-center gap-2">
                <MapPin size={18} className="text-earth-500" />
                My Primary Farm
              </h2>
              <div className="flex items-center gap-2">
                <Link to="/profile"
                  className="text-xs font-semibold text-primary-600
                             flex items-center gap-1">
                  Manage <ArrowRight size={12} />
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs font-semibold text-red-600
                             flex items-center gap-1 hover:bg-red-50
                             px-2 py-1 rounded-lg transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl
                            shadow-sm p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-earth-50 rounded-2xl
                                flex items-center justify-center
                                flex-shrink-0">
                  <Home size={24} className="text-earth-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">
                    {primaryFarm.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {primaryFarm.county}
                    {primaryFarm.sub_county
                      ? `, ${primaryFarm.sub_county}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {[
                      {
                        icon: <Ruler size={14} className="text-gray-400" />,
                        label: `${primaryFarm.size_acres || 0} acres`
                      },
                      {
                        icon: <Globe size={14} className="text-gray-400" />,
                        label: primaryFarm.soil_type
                          ? `${primaryFarm.soil_type} soil` : 'Unknown soil'
                      },
                      {
                        icon: <Droplets size={14} className="text-gray-400" />,
                        label: primaryFarm.water_source
                          ? primaryFarm.water_source.replace('_', ' ')
                          : 'Unknown'
                      },
                    ].map((item, i) => (
                      <div key={i}
                        className="flex items-center gap-1.5 text-xs
                                   text-gray-500 bg-gray-50 px-2.5 py-1.5
                                   rounded-xl">
                        <span>{item.icon}</span>
                        <span className="capitalize">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NO FARM CTA ──────────────────────────────── */}
        {farms.length === 0 && !errors.crops && (
          <div className="bg-gradient-to-br from-primary-50
                          to-primary-100 border border-primary-200
                          rounded-2xl p-6 text-center">
            <Home size={48} className="text-primary-400 mb-3 block mx-auto" />
            <p className="font-bold text-primary-900 text-sm mb-1">
              Set Up Your Farm
            </p>
            <p className="text-xs text-primary-700 mb-4">
              Add your farm location and crops to get hyperlocal
              weather forecasts and crop advisories
            </p>
            <Link to="/farm-setup">
              <button className="bg-primary-600 text-white text-sm
                                  font-bold px-6 py-3 rounded-xl
                                  hover:bg-primary-700 transition-colors
                                  shadow-sm">
                Add My Farm Now
              </button>
            </Link>
          </div>
        )}

        {/* ── SUBSCRIPTION PLANS ───────────────────────── */}
        {!subscription?.is_active && plans.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3
                           flex items-center gap-2">
              <CreditCard size={18} className="text-purple-500" />
              Upgrade Your Plan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans
                .filter(p => ['basic_monthly', 'pro_monthly']
                  .includes(p.plan_id))
                .map((plan) => {
                  const isPro = plan.plan_id === 'pro_monthly'
                  return (
                    <div key={plan.plan_id}
                      className={`
                        relative rounded-2xl p-4 border-2 transition-all
                        ${isPro
                          ? 'bg-gradient-to-br from-primary-700 to-primary-600 border-primary-700 text-white'
                          : 'bg-white border-gray-200 hover:border-primary-300'
                        }
                      `}
                    >
                      {isPro && (
                        <div className="absolute -top-3 right-4">
                          <span className="bg-harvest-500 text-white
                                           text-xs font-bold px-3 py-1
                                           rounded-full">
                            <Star size={12} className="inline mr-1" /> Popular
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className={`font-bold ${
                            isPro ? 'text-white' : 'text-gray-900'
                          }`}>
                            {plan.name}
                          </p>
                          <p className={`text-2xl font-bold mt-1 ${
                            isPro ? 'text-white' : 'text-primary-700'
                          }`}>
                            KSH {plan.price_ksh}
                            <span className={`text-sm font-normal ${
                              isPro ? 'text-primary-200' : 'text-gray-400'
                            }`}>
                              /mo
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        {Object.entries(plan.features || {})
                          .filter(([k, v]) => v === true)
                          .slice(0, 4)
                          .map(([key]) => (
                            <div key={key}
                              className="flex items-center gap-2 text-xs">
                              <CheckCircle size={12}
                                className={isPro
                                  ? 'text-primary-300'
                                  : 'text-primary-500'
                                }
                              />
                              <span className={`capitalize ${
                                isPro ? 'text-primary-100' : 'text-gray-600'
                              }`}>
                                {key.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))
                        }
                      </div>

                      <Link to="/subscription">
                        <button className={`
                          w-full py-2.5 text-sm font-bold rounded-xl
                          transition-colors
                          ${isPro
                            ? 'bg-white text-primary-700 hover:bg-primary-50'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                          }
                        `}>
                          Subscribe — KSH {plan.price_ksh}/mo
                        </button>
                      </Link>
                    </div>
                  )
                })
              }
            </div>
          </div>
        )}

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

        {/* Delete Farm Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-red-500" />
                <h3 className="text-lg font-bold text-gray-900">Delete Farm</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "{primaryFarm?.name}"? This action cannot be undone and will remove all associated crops and data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFarm}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                >
                  Delete Farm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />

      </div>
    </div>
  )
}
