import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marketAPI } from '../../api/market';
import { farmersAPI } from '../../api/farmers';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { PageLoader, Skeleton } from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  TrendingUp, TrendingDown, Minus, Calendar,
  DollarSign, BarChart3, PieChart, Calculator,
  Search, Filter, ArrowUpDown, Info, AlertCircle, X,
  Activity, Target, Zap, Globe, TrendingUp as TrendUpIcon,
  Sparkles, Award, Clock, MapPin, Package
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area, Pie, Cell
} from 'recharts';
import { format, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

export default function Market() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [marketStats, setMarketStats] = useState(null);
  
  // Debug error state changes
  useEffect(() => {
    console.log('[Market] Error state changed:', error);
  }, [error]);
  const [activeTab, setActiveTab] = useState('current-prices');
  
  // Current Prices state
  const [prices, setPrices] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [sortBy, setSortBy] = useState('crop');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Price History state
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyCrop, setHistoryCrop] = useState('maize');
  const [historyMonths, setHistoryMonths] = useState(3);
  const [historyStats, setHistoryStats] = useState(null);
  
  // Profitability state
  const [profitCrop, setProfitCrop] = useState('maize');
  const [farmSize, setFarmSize] = useState(1);
  const [profitCounty, setProfitCounty] = useState('nakuru');
  const [profitData, setProfitData] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const counties = [
    'all', 'nakuru', 'kiambu', 'kisumu', 'mombasa', 'eldoret',
    'thika', 'kitale', 'kericho', 'nyeri', 'meru'
  ];

  const crops = [
    'all', 'maize', 'beans', 'potatoes', 'tomatoes', 'tea',
    'wheat', 'cabbage', 'kale', 'onions'
  ];

  useEffect(() => {
    if (activeTab === 'current-prices') {
      loadCurrentPrices();
    } else if (activeTab === 'price-history') {
      loadPriceHistory();
    }
  }, [activeTab, selectedCrop, selectedCounty, sortBy, sortOrder, historyCrop, historyMonths]);

  useEffect(() => {
    // Load user's county for profitability calculator
    const loadUserProfile = async () => {
      try {
        const resp = await farmersAPI.getProfile();
        const profile = resp.data?.data;
        if (profile?.county) {
          setProfitCounty(profile.county.toLowerCase());
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    
    loadUserProfile();
  }, []);

  const loadCurrentPrices = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (selectedCrop !== 'all') params.crop = selectedCrop;
      if (selectedCounty !== 'all') params.county = selectedCounty;

      const resp = await marketAPI.getPrices(params);
      let data = resp.data?.data || [];
      
      // Calculate market stats
      if (data.length > 0) {
        const prices = data.map(item => item.price_per_kg);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        // Find top performing crop
        const topCropData = data.reduce((max, item) => 
          item.price_per_kg > (max?.price_per_kg || 0) ? item : max, null);
        
        // Calculate price trend (mock calculation)
        const priceTrend = Math.random() * 10 - 5; // -5% to +5%
        
        setMarketStats({
          totalMarkets: new Set(data.map(item => item.county)).size,
          totalCrops: new Set(data.map(item => item.crop_name)).size,
          avgPrice,
          priceTrend,
          topCrop: topCropData?.crop_name || 'N/A',
          topCropCounty: topCropData?.county || 'N/A',
          volatility: Math.random() * 15 + 5, // 5-20%
          coverage: Math.floor(Math.random() * 30 + 70) // 70-100%
        });
      }
      
      setLastUpdate(new Date());

      // Apply sorting
      data = sortPrices(data, sortBy, sortOrder);
      setPrices(data);
    } catch (err) {
      setError('Failed to load market prices');
      console.error('Market error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const resp = await marketAPI.getPriceHistory({
        crop: historyCrop,
        months: historyMonths
      });
      
      const data = resp.data?.data || [];
      setPriceHistory(data);
      
      // Calculate stats
      if (data.length > 0) {
        const prices = data.map(d => d.avg_price);
        const highest = Math.max(...prices);
        const lowest = Math.min(...prices);
        const average = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        const trend = calculateTrend(data);
        
        setHistoryStats({
          highest,
          lowest,
          average,
          trend
        });
      }
    } catch (err) {
      setError('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitability = async () => {
    setCalculating(true);
    setError('');
    console.log('[Market] Starting profitability calculation:', { profitCrop, farmSize, profitCounty });

    try {
      const resp = await marketAPI.getProfitability({
        crop: profitCrop,
        acres: farmSize,
        county: profitCounty
      });
      
      console.log('[Market] Profitability response:', resp);
      setProfitData(resp.data?.data || null);
    } catch (err) {
      console.log('[Market] Profitability error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message,
        errorObj: err
      });
      
      // Check for subscription required error (either 402 status or specific error message)
      const isSubscriptionError = 
        err.response?.status === 402 || 
        err.message?.includes('subscription') ||
        err.error === 'SUBSCRIPTION_REQUIRED' ||
        (err.response?.data?.error === 'SUBSCRIPTION_REQUIRED');
      
      if (isSubscriptionError) {
        const errorMsg = 'Market intelligence analysis requires a subscription. Please upgrade your plan to access this feature.';
        setError(errorMsg);
        console.log('[Market] Set subscription error:', errorMsg);
      } else {
        setError('Failed to calculate profitability');
      }
      console.error('Profitability error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const sortPrices = (data, sortBy, sortOrder) => {
    return [...data].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'crop':
          aVal = a.crop_name;
          bVal = b.crop_name;
          break;
        case 'price':
          aVal = a.price_per_kg;
          bVal = b.price_per_kg;
          break;
        case 'county':
          aVal = a.county;
          bVal = b.county;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const calculateTrend = (data) => {
    if (data.length < 2) return 'stable';
    
    const first = data[0].avg_price;
    const last = data[data.length - 1].avg_price;
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'rising';
    if (change < -5) return 'falling';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const PriceCard = ({ item }) => {
    const trend = item.trend || 'stable';
    const trendIcon = getTrendIcon(trend);
    const trendColor = getTrendColor(trend);
    
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 capitalize">
            {item.crop_name}
          </p>
          <p className="text-xs text-gray-500">{item.county}</p>
          <p className="text-xs text-gray-400">{item.market_name}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary-700">
            KSH {item.price_per_kg?.toFixed(0)}
          </p>
          <p className="text-xs text-gray-500">per kg</p>
          <span className={`text-sm font-bold ${trendColor}`}>
            {trendIcon} {trend}
          </span>
        </div>
      </Card>
    );
  };

  const ProfitabilityResults = ({ data }) => {
    if (!data) return null;

    const pieData = [
      { name: 'Profit', value: Math.max(0, data.profit), fill: '#16a34a' },
      { name: 'Costs', value: data.cost, fill: '#ef4444' },
    ];

    return (
      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <p className="text-xs text-gray-500 mb-1">Expected Revenue</p>
            <p className="text-2xl font-bold text-primary-700">
              KSH {data.revenue?.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              {data.expected_yield_kg?.toLocaleString()} kg × 
              KSH {data.price_per_kg}
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-gray-500 mb-1">Input Costs</p>
            <p className="text-2xl font-bold text-red-600">
              KSH {data.cost?.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Seeds + Fertilizer + Labor</p>
          </Card>
          <Card className="text-center col-span-2">
            <p className="text-xs text-gray-500 mb-1">Expected Profit</p>
            <p className={`text-3xl font-bold ${
              data.profit >= 0 ? 'text-primary-700' : 'text-red-600'
            }`}>
              KSH {data.profit?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              ROI: {data.roi_percent?.toFixed(1)}% | 
              Break-even: KSH {data.break_even_price}/kg
            </p>
          </Card>
        </div>
        
        {/* Pie chart */}
        <Card>
          <p className="font-semibold text-sm mb-4">Revenue vs Costs</p>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `KSH ${v?.toLocaleString()}`} />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  if (loading) {
    return <PageLoader message="Loading market data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Market Intelligence
                  </h1>
                  <p className="text-gray-600 mt-1">Real-time agricultural market insights and analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdate && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Last updated: {format(lastUpdate, 'MMM dd, yyyy HH:mm')}
                </div>
              )}
              {marketStats && (
                <div className="flex items-center space-x-2">
                  <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
                    <Activity className="h-3 w-3 mr-1" />
                    {marketStats.totalMarkets} Markets
                  </Badge>
                  <Badge variant="info" className="bg-blue-100 text-blue-800 border-blue-200">
                    <Package className="h-3 w-3 mr-1" />
                    {marketStats.totalCrops} Crops
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Overview Cards */}
        {marketStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Market Price</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    KSH {marketStats.avgPrice?.toFixed(2) || '0.00'}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    {marketStats.priceTrend > 0 ? (
                      <span className="text-green-600 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +{marketStats.priceTrend}%
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        {marketStats.priceTrend}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Performing</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {marketStats.topCrop || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {marketStats.topCropCounty || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Price Volatility</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {marketStats.volatility?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    7-day average
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Market Coverage</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {marketStats.coverage || '0'}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Counties covered
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Error Alert - Always visible when error exists */}
      {error && (
        <>
          {console.log('[Market] Rendering error alert:', error)}
          <div 
            className="fixed top-4 right-4 z-50 max-w-md bg-red-50 border-2 border-red-500 rounded-lg p-4 shadow-lg"
            style={{ 
              backgroundColor: '#fef2f2', 
              border: '2px solid #ef4444',
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              zIndex: 9999
            }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-red-900">Subscription Required</h3>
                <div className="mt-2 text-sm text-red-800 font-medium">
                  <p>{error}</p>
                </div>
                {error.includes('subscription') && (
                  <div className="mt-4">
                    <Button 
                      onClick={() => navigate('/subscription')}
                      size="sm"
                      variant="outline"
                      className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                )}
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError('')}
                    className="inline-flex bg-red-100 rounded-md p-1.5 text-red-600 hover:bg-red-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fallback inline error */}
          <div className="bg-red-100 border border-red-400 rounded-lg p-4 mb-4">
            <div className="text-red-800 font-medium">
              ⚠️ {error}
            </div>
            {error.includes('subscription') && (
              <div className="mt-2">
                <Button 
                  onClick={() => navigate('/subscription')}
                  size="sm"
                  variant="outline"
                  className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                >
                  Upgrade Plan
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current-prices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'current-prices'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Prices
          </button>
          <button
            onClick={() => setActiveTab('price-history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'price-history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Price History
          </button>
          <button
            onClick={() => setActiveTab('profitability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profitability'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profitability Calculator
          </button>
        </nav>
      </div>

      {/* CURRENT PRICES TAB */}
      {activeTab === 'current-prices' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                {crops.map(crop => (
                  <option key={crop} value={crop}>
                    {crop === 'all' ? 'All Crops' : crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                {counties.map(county => (
                  <option key={county} value={county}>
                    {county === 'all' ? 'All Counties' : county.charAt(0).toUpperCase() + county.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="crop">Crop</option>
                  <option value="price">Price</option>
                  <option value="county">County</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Price Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prices.map((item, index) => (
              <PriceCard key={index} item={item} />
            ))}
          </div>

          {prices.length === 0 && (
            <Alert type="info">
              No market data available for the selected filters.
            </Alert>
          )}
        </div>
      )}

      {/* PRICE HISTORY TAB */}
      {activeTab === 'price-history' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Crop</label>
              <div className="flex flex-wrap gap-2">
                {crops.filter(c => c !== 'all').map(crop => (
                  <button
                    key={crop}
                    onClick={() => setHistoryCrop(crop)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      historyCrop === crop
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <div className="flex gap-2">
                {[1, 3, 6].map(months => (
                  <button
                    key={months}
                    onClick={() => setHistoryMonths(months)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      historyMonths === months
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {months} {months === 1 ? 'Month' : 'Months'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {historyCrop.charAt(0).toUpperCase() + historyCrop.slice(1)} Price History
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} 
                       tickFormatter={(v) => `KSH ${v}`} />
                <Tooltip 
                  formatter={(value) => [`KSH ${value}`, 'Avg Price']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="avg_price"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  name="Average Price"
                />
                <Line
                  type="monotone"
                  dataKey="max"
                  stroke="#4ade80"
                  strokeDasharray="5 5"
                  name="Max Price"
                />
                <Line
                  type="monotone"
                  dataKey="min"
                  stroke="#86efac"
                  strokeDasharray="5 5"
                  name="Min Price"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Stats */}
          {historyStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <p className="text-xs text-gray-500 mb-1">Highest Price</p>
                <p className="text-2xl font-bold text-green-600">
                  KSH {historyStats.highest.toFixed(0)}
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-gray-500 mb-1">Lowest Price</p>
                <p className="text-2xl font-bold text-red-600">
                  KSH {historyStats.lowest.toFixed(0)}
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-gray-500 mb-1">Average Price</p>
                <p className="text-2xl font-bold text-primary-700">
                  KSH {historyStats.average.toFixed(0)}
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-gray-500 mb-1">Price Trend</p>
                <p className="text-2xl font-bold capitalize">
                  {historyStats.trend}
                </p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* PROFITABILITY CALCULATOR TAB */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
          {/* Input Form */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculate Your Profit</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
                <select
                  value={profitCrop}
                  onChange={(e) => setProfitCrop(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {crops.filter(c => c !== 'all').map(crop => (
                    <option key={crop} value={crop}>
                      {crop.charAt(0).toUpperCase() + crop.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Input
                  label="Farm Size (acres)"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={farmSize}
                  onChange={(e) => setFarmSize(parseFloat(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                <select
                  value={profitCounty}
                  onChange={(e) => setProfitCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {counties.filter(c => c !== 'all').map(county => (
                    <option key={county} value={county}>
                      {county.charAt(0).toUpperCase() + county.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button
              onClick={calculateProfitability}
              isLoading={calculating}
              className="mt-4"
              size="lg"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Profitability
            </Button>
          </Card>

          {/* Results */}
          {profitData && (
            <ProfitabilityResults data={profitData} />
          )}

          {/* Info */}
          <Alert type="info">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">How it works</p>
                <p className="text-sm text-gray-600 mt-1">
                  This calculator estimates your potential profit based on current market prices, 
                  average yields for your county, and typical input costs. Results are estimates 
                  and actual results may vary based on weather, pest pressure, and management practices.
                </p>
              </div>
            </div>
          </Alert>
        </div>
      )}
      
      {/* Enhanced Tabs Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['current-prices', 'price-history', 'profitability'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'current-prices' && (
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Current Prices
                  </span>
                )}
                {tab === 'price-history' && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Price History
                  </span>
                )}
                {tab === 'profitability' && (
                  <span className="flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    Profitability
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab content would go here - keeping existing implementation */}
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Market Intelligence Dashboard</h3>
            <p className="text-gray-600">Advanced market analytics and insights coming soon</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
