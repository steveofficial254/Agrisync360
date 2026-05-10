import { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, AlertTriangle, DollarSign, BarChart3, 
  Package, Send, Shield, Activity, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { PageLoader } from '../../components/common/Loader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const kenyanCounties = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
  'Kiambu', 'Thika', 'Kitale', 'Kericho', 'Nyeri',
  'Meru', 'Kakamega', 'Kisii', 'Bungoma', 'Busia',
  'Homa Bay', 'Migori', 'Kilifi', 'Kwale', 'Tana River',
  'Lamu', 'Garissa', 'Wajir', 'Mandera', 'Marsabit',
  'Isiolo', 'Samburu', 'Turkana', 'West Pokot', 'Baringo',
  'Koibatek', 'Nandi', 'Uasin Gishu', 'Elgeyo Marakwet',
  'Bomet', 'Narok', 'Kajiado', 'Taita Taveta', 'Kwale',
  'Makueni', 'Machakos', 'Kitui', 'Embu', 'Tharaka Nithi',
  'Kirinyaga', 'Muranga', 'Nyandarua', 'Laikipia', 'Samburu'
];

import { adminAPI } from '../../api/admin';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topCounties, setTopCounties] = useState([]);
  const [topCrops, setTopCrops] = useState([]);
  const [recentFarmers, setRecentFarmers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [alertForm, setAlertForm] = useState({
    message: '',
    segment: 'all',
    county: '',
    crop: '',
    preview: ''
  });
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        statsResp,
        revenueResp,
        countiesResp,
        cropsResp,
        farmersResp,
        healthResp
      ] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRevenue(),
        adminAPI.getTopCounties(),
        adminAPI.getTopCrops(),
        adminAPI.getRecentFarmers(),
        adminAPI.getSystemHealth()
      ]);

      setStats(statsResp.data);
      setRevenueData(revenueResp.data);
      setTopCounties(countiesResp.data);
      setTopCrops(cropsResp.data);
      setRecentFarmers(farmersResp.data);
      setSystemHealth(healthResp.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (!alertForm.message.trim()) {
      setError('Please enter an alert message');
      return;
    }

    setSendingAlert(true);
    setError('');

    try {
      const resp = await adminAPI.sendBulkAlert(alertForm);
      toast.success(resp.message);
      setAlertForm({ message: '', segment: 'all', county: '', crop: '', preview: '' });
    } catch (err) {
      setError(err.message || 'Failed to send alert');
    } finally {
      setSendingAlert(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color }) => (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% this week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  const HealthCard = ({ title, status, icon }) => {
    const statusColors = {
      connected: 'bg-green-100 text-green-800',
      running: 'bg-blue-100 text-blue-800',
      active: 'bg-primary-100 text-primary-800',
      disconnected: 'bg-red-100 text-red-800',
      down: 'bg-gray-100 text-gray-800'
    };

    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${statusColors[status] || statusColors.down}`}>
            {icon}
          </div>
          <div>
            <p className="font-medium text-gray-900">{title}</p>
            <p className="text-sm text-gray-500 capitalize">{status}</p>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management</p>
        </div>
        <Button
          variant="outline"
          onClick={loadDashboardData}
          isLoading={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Farmers"
          value={stats?.farmers?.total?.toLocaleString() || '0'}
          change={stats?.farmers?.change || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.subscriptions?.active?.toLocaleString() || '0'}
          change={stats?.subscriptions?.change || 0}
          icon={<Users className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Revenue This Month"
          value={`KSH ${(stats?.subscriptions?.revenue_this_month_ksh / 1000).toFixed(0)}K`}
          change={stats?.subscriptions?.change || 0}
          icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <StatCard
          title="SMS Sent Today"
          value={stats?.sms?.sent_today?.toLocaleString() || '0'}
          icon={<Send className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `KSH ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `KSH ${value?.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Counties & Crops */}
        <div className="space-y-6">
          {/* Top Counties */}
          <Card>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Top 5 Counties</h3>
            <div className="space-y-2">
              {topCounties.map((county, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{county.county}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{county.county.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{county.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Crops */}
          <Card>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Top 5 Crops</h3>
            <div className="space-y-2">
              {topCrops.map((crop, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-earth-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900 capitalize">{crop.crop}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{crop.count.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{crop.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Farmers Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Farmers</h2>
          <Button
            onClick={() => navigate('/admin/farmers')}
            variant="outline"
            size="sm"
          >
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  County
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentFarmers.map((farmer) => (
                <tr key={farmer.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{farmer.name}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-500">{farmer.phone}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-900 capitalize">{farmer.county}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={farmer.plan === 'pro' ? 'pro' : farmer.plan === 'basic' ? 'basic' : 'free'}>
                      {farmer.plan?.toUpperCase() || 'FREE'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-500">
                      {farmer.joined_at ? format(new Date(farmer.joined_at), 'MMM d, yyyy') : 'Unknown'}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: View farmer details */}}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: Send individual SMS */}}
                      >
                        SMS
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Health */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthCard
            title="Database"
            status={systemHealth?.database || 'disconnected'}
            icon={<Shield className="w-5 h-5" />}
          />
          <HealthCard
            title="Redis"
            status={systemHealth?.redis || 'disconnected'}
            icon={<Package className="w-5 h-5" />}
          />
          <HealthCard
            title="Celery"
            status={systemHealth?.celery || 'down'}
            icon={<Activity className="w-5 h-5" />}
          />
          <HealthCard
            title="SMS Service"
            status={systemHealth?.sms_service || 'disconnected'}
            icon={<Send className="w-5 h-5" />}
          />
        </div>
      </Card>

      {/* Send Bulk Alert */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Bulk Alert</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Message</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="Enter alert message for farmers..."
              value={alertForm.message}
              onChange={(e) => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
              <select
                value={alertForm.segment}
                onChange={(e) => setAlertForm(prev => ({ ...prev, segment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All farmers</option>
                <option value="active">Active subscribers</option>
                <option value="by_county">By county</option>
                <option value="by_crop">By crop</option>
              </select>
            </div>

            {(alertForm.segment === 'by_county' || alertForm.segment === 'by_crop') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {alertForm.segment === 'by_county' ? 'County' : 'Crop'}
                </label>
                <select
                  value={alertForm.county || alertForm.crop}
                  onChange={(e) => setAlertForm(prev => ({ 
                    ...prev, 
                    [alertForm.segment]: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select {alertForm.segment === 'by_county' ? 'county' : 'crop'}</option>
                  {alertForm.segment === 'by_county' ? (
                    kenyanCounties.map(county => (
                      <option key={county} value={county.toLowerCase()}>
                        {county}
                      </option>
                    ))
                  ) : (
                    ['maize', 'beans', 'potatoes', 'tomatoes', 'tea', 'wheat', 'cabbage', 'kale', 'onions'].map(crop => (
                      <option key={crop} value={crop}>
                        {crop.charAt(0).toUpperCase() + crop.slice(1)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Will send to</span>
              <span className="font-medium text-gray-900">
                {alertForm.segment === 'all' ? stats?.farmers?.total || 0 :
                 alertForm.segment === 'active' ? stats?.subscriptions?.active || 0 :
                 alertForm.segment === 'by_county' ? 
                   topCounties.find(c => c.county.toLowerCase() === alertForm.county)?.count || 0 :
                   topCrops.find(c => c.crop === alertForm.crop)?.count || 0
                } farmers
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Preview: {alertForm.message || 'No message entered'}
            </p>
          </div>

          <Button
            onClick={handleSendAlert}
            isLoading={sendingAlert}
            disabled={!alertForm.message.trim()}
            size="lg"
            className="w-full"
          >
            Send Alert
          </Button>
        </div>
      </Card>
    </div>
  );
}
