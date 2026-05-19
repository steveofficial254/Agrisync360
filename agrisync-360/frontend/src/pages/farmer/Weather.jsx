import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { weatherAPI } from '../../api/weather';
import { farmersAPI } from '../../api/farmers';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { PageLoader, Skeleton } from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import {
  Cloud, Droplets, Wind, Thermometer,
  AlertTriangle, CheckCircle, Info, Sun,
  CloudRain, Zap, Eye, RefreshCw,
  MapPin, Calendar, TrendingUp,
  Snowflake, CloudDrizzle, Gauge,
  Sunrise, Sunset, Compass,
  Activity, BarChart3, Timer
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { format, parseISO, addDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function Weather() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [farmInfo, setFarmInfo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Wait for auth to load before fetching
    if (authLoading) return;

    fetchWeatherData();
  }, [authLoading, isAuthenticated]);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError('');

    try {
      // Try to get farm location (requires auth)
      let lat = -1.2921;  // Default Nairobi
      let lon = 36.8219;
      let farmName = 'Default Location (Nairobi)';

      if (isAuthenticated) {
        try {
          const farmsResp = await farmersAPI.listFarms();
          const farms = farmsResp.data?.data || [];
          const primaryFarm = farms.find(f => f.is_primary) || farms[0];
          if (primaryFarm?.latitude && primaryFarm?.longitude) {
            lat = primaryFarm.latitude;
            lon = primaryFarm.longitude;
            farmName = primaryFarm.name || 'My Farm';
            setFarmInfo(primaryFarm);
          }
        } catch (farmError) {
          // Farm fetch failed — use default location silently
          if (farmError?.status === 404) {
            console.log('[Weather] No farmer profile found - using default location');
          } else {
            console.log('[Weather] Using default location:', farmError?.message);
          }
        }
      }

      setFarmInfo({ name: farmName, latitude: lat, longitude: lon });

      // Fetch weather (public endpoint — no auth needed)
      const weatherResp = await weatherAPI.getForecast(lat, lon);
      
      if (weatherResp.data?.success) {
        setWeatherData(weatherResp.data.data);
      } else {
        throw new Error(weatherResp.data?.message || 'Weather fetch failed');
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Weather] Error:', err);
      // Don't show 401 errors as weather errors
      if (err?.status !== 401) {
        setError('Unable to load weather data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWeatherData();
    setRefreshing(false);
    toast.success('Weather data refreshed');
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return { icon: <Sun size={48} className="text-yellow-500" />, label: 'Clear sky' };
    if (code <= 2) return { icon: <Cloud size={48} className="text-gray-400" />, label: 'Partly cloudy' };
    if (code === 3) return { icon: <Cloud size={48} className="text-gray-500" />, label: 'Overcast' };
    if (code <= 48) return { icon: <Wind size={48} className="text-gray-300" />, label: 'Foggy' };
    if (code <= 67) return { icon: <CloudRain size={48} className="text-blue-500" />, label: 'Rainy' };
    if (code <= 77) return { icon: <Snowflake size={48} className="text-cyan-400" />, label: 'Snowy' };
    if (code <= 82) return { icon: <CloudDrizzle size={48} className="text-blue-400" />, label: 'Showers' };
    if (code <= 99) return { icon: <Zap size={48} className="text-purple-500" />, label: 'Thunderstorm' };
    return { icon: <Thermometer size={48} className="text-gray-400" />, label: 'Unknown' };
  };

  const getRiskColor = (risk) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      very_high: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[risk] || colors.low;
  };

  const getRiskMessage = (risk) => {
    const messages = {
      low: 'Low disease risk today. Conditions favorable.',
      medium: 'Moderate disease risk. Monitor your crops.',
      high: 'High fungal risk! Consider preventive spray.',
      very_high: 'Very high disease risk! Spray immediately.'
    };
    return messages[risk] || messages.low;
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return <PageLoader message="Loading..." />;
  }

  if (loading) {
    return <PageLoader message="Loading weather data..." />;
  }

  const today = weatherData?.forecast?.[0];
  const forecast = weatherData?.forecast || [];
  const diseaseRisk = today?.disease_risk || 'low';

  // Prepare data for charts
  const tempData = forecast.map((day, index) => ({
    day: format(addDays(new Date(), index), 'EEE'),
    max: day.temperature_max,
    min: day.temperature_min,
    avg: (day.temperature_max + day.temperature_min) / 2
  }));

  const rainData = forecast.map((day, index) => ({
    day: format(addDays(new Date(), index), 'EEE'),
    precipitation: day.precipitation_mm || 0
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* SECTION 1: Location Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {farmInfo?.name || 'Default Location'} Weather
              </h1>
              <p className="text-sm text-gray-500">
                {farmInfo?.county || 'Nairobi'} — {farmInfo?.latitude || '-1.2921'}°, {farmInfo?.longitude || '36.8219'}°
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-400">
                  Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* SECTION 2: Today's Conditions Card */}
      {today && (
        <Card className="bg-gradient-to-br from-primary-50 to-earth-50">
          <div className="text-center md:text-left md:flex md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <div className="flex items-center justify-center">
                  {getWeatherIcon(today.weather_code).icon}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {today.temperature_max}°/{today.temperature_min}°C
                  </h2>
                  <p className="text-gray-600 capitalize">
                    {getWeatherIcon(today.weather_code).label}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">
                    {today.precipitation_mm || 0}mm rain
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {today.wind_speed || 0} km/h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-700">
                    {today.humidity || 0}% humidity
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">
                    UV {today.uv_index || 'Low'}
                  </span>
                </div>
              </div>
              
              {/* Additional weather details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-700">
                    {today.sunrise || '06:00'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-700">
                    {today.sunset || '18:30'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-700">
                    {today.wind_direction || 'N'} {today.wind_speed || 0}km/h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">
                    {today.pressure || '1013'} hPa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 3: Disease Risk Alert Banner */}
      <Alert type={diseaseRisk === 'very_high' ? 'error' : diseaseRisk === 'high' ? 'warning' : 'info'}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Disease Risk: {diseaseRisk.replace('_', ' ').toUpperCase()}</span>
        </div>
        <p className="mt-1">{getRiskMessage(diseaseRisk)}</p>
      </Alert>

      {/* SECTION 4: Planting Window Card */}
      {today && (
        <Card className={today.planting_window_available ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              today.planting_window_available ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              {today.planting_window_available ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Info className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {today.planting_window_available ? (
                  <><CheckCircle className="w-5 h-5 text-green-600" /> Good Planting Window</>
                ) : (
                  <><Info className="w-5 h-5 text-gray-600" /> No optimal planting window</>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {today.planting_window_available 
                  ? '3+ consecutive days with adequate rainfall forecast'
                  : 'No optimal planting window in next 7 days'
                }
              </p>
              {today.planting_window_days && (
                <p className="text-xs text-gray-500 mt-1">
                  Optimal days: {today.planting_window_days.join(', ')}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 5: 7-Day Forecast Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">7-Day Forecast</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast.map((day, index) => {
            const isToday = index === 0;
            const weather = getWeatherIcon(day.weather_code);
            
            return (
              <Card
                key={index}
                className={`text-center p-3 ${
                  isToday ? 'border-primary-500 bg-primary-50' : ''
                }`}
              >
                <p className="text-xs font-medium text-gray-500 mb-2">
                  {isToday ? 'Today' : format(addDays(new Date(), index), 'EEE')}
                </p>
                <div className="text-2xl mb-2 flex justify-center">{weather.icon}</div>
                <p className="text-sm font-bold text-gray-900">
                  {day.temperature_max}°
                </p>
                <p className="text-xs text-gray-500">
                  {day.temperature_min}°
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {day.precipitation_mm || 0}mm
                </p>
                {day.precipitation_probability && (
                  <div className="mt-1">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${day.precipitation_probability}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {day.precipitation_probability}%
                    </p>
                  </div>
                )}
                {day.disease_risk && (
                  <div className="mt-2">
                    <div className={`w-2 h-2 rounded-full mx-auto ${
                      day.disease_risk === 'very_high' ? 'bg-red-500' :
                      day.disease_risk === 'high' ? 'bg-orange-500' :
                      day.disease_risk === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 6: Temperature Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Temperature Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={tempData}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [`${value}°C`, 'Temperature']}
              labelFormatter={(label) => `Day: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="max"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#tempGradient)"
              name="Max Temp"
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="#86efac"
              strokeWidth={1}
              fill="url(#tempGradient)"
              fillOpacity={0.3}
              name="Min Temp"
            />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* SECTION 7: Rainfall Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rainfall Forecast</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={rainData}>
            <defs>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [`${value}mm`, 'Rainfall']}
              labelFormatter={(label) => `Day: ${label}`}
            />
            <Bar
              dataKey="precipitation"
              fill="url(#rainGradient)"
              radius={[4,4,0,0]}
              name="Precipitation"
            />
            <Line
              type="monotone"
              dataKey={() => 10}
              stroke="#ef4444"
              strokeDasharray="5 5"
              dot={false}
              name="Planting Threshold"
            />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* SECTION 8: Frost Risk Section */}
      {(farmInfo?.county === 'Nyandarua' || farmInfo?.county === 'Nyeri' || 
        farmInfo?.county === 'Kirinyaga' || farmInfo?.county === 'Muranga') && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frost Risk</h2>
          {forecast.some(day => day.frost_risk) ? (
            <Alert type="warning">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span className="font-medium">Frost Warning</span>
              </div>
              <p className="mt-1">
                Frost risk detected on: {forecast
                  .filter(day => day.frost_risk)
                  .map((day, index) => format(addDays(new Date(), index), 'EEEE'))
                  .join(', ')
                }
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Protect sensitive crops like tea bushes on these days
              </p>
            </Alert>
          ) : (
            <Alert type="success">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">No Frost Risk</span>
              </div>
              <p className="mt-1">No frost risk in the next 7 days</p>
            </Alert>
          )}
        </Card>
      )}

      {/* SECTION 9: Historical Rainfall Context */}
      {weatherData?.historical && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month vs Normal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Actual Rainfall</p>
              <p className="text-2xl font-bold text-blue-600">
                {weatherData.historical.actual_mm}mm
              </p>
              <p className="text-xs text-gray-400">
                {weatherData.historical.month}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Historical Average</p>
              <p className="text-2xl font-bold text-gray-600">
                {weatherData.historical.average_mm}mm
              </p>
              <p className="text-xs text-gray-400">
                Same month (30-year avg)
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>{weatherData.historical.percentage_of_average}% of normal</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  weatherData.historical.percentage_of_average >= 100 
                    ? 'bg-green-500' 
                    : weatherData.historical.percentage_of_average >= 70 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, weatherData.historical.percentage_of_average)}%` }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
