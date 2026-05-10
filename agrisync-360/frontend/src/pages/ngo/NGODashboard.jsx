import React, { useState, useEffect } from 'react';
import { 
  Users, Target, Send, BarChart3, TrendingUp, RefreshCw,
  Plus, Upload, Calendar, MapPin, Users2, CheckCircle,
  AlertTriangle, Download
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { PageLoader } from '../../components/common/Loader';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { ngoAPI } from '../../api/ngo';

export default function NGODashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [farmers, setFarmers] = useState([]); 
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  
  // Batch form
  const [batchForm, setBatchForm] = useState({
    batch_name: '',
    county: '',
    farmers_text: '',
    crop_filter: 'all'
  });
  
  // SMS form
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);
  const [batchStatus, setBatchStatus] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashboardResp, statsResp, batchesResp, farmersResp] = await Promise.all([
        ngoAPI.getDashboard(),
        ngoAPI.getStats(),
        ngoAPI.getBatches(),
        ngoAPI.getFarmers()
      ]);

      setDashboardData(dashboardResp.data);
      setStats(statsResp.data);
      setBatches(batchesResp.data);
      setFarmers(farmersResp.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('NGO dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!batchForm.batch_name.trim() || !batchForm.county || !batchForm.farmers_text.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const farmers = batchForm.farmers_text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [phone, ...nameParts] = line.split(/\s+/);
        return {
          phone: phone.startsWith('07') ? `+254${phone.slice(1)}` : phone,
          name: nameParts.slice(1).join(' '),
          county: batchForm.county
        };
      });

    try {
      const resp = await ngoAPI.createBatch({
        batch_name: batchForm.batch_name,
        county: batchForm.county,
        farmers
      });

      setBatches(prev => [...prev, resp.data]);
      setShowBatchModal(false);
      resetBatchForm();
      toast.success('Batch created successfully');
    } catch (err) {
      setError(err.message || 'Failed to create batch');
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      setError('Please enter an SMS message');
      return;
    }

    setSendingSMS(true);
    setError('');

    try {
      const resp = await ngoAPI.sendAdvisorySMS({
        message: smsMessage,
        farmer_ids: farmers.map(f => f.id)
      });
      toast.success(resp.message);
      setShowSMSModal(false);
      setSmsMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send SMS');
    } finally {
      setSendingSMS(false);
    }
  };

  const resetBatchForm = () => {
    setBatchForm({
      batch_name: '',
      county: '',
      farmers_text: '',
      crop_filter: 'all'
    });
  };

  const openBatchModal = () => {
    resetBatchForm();
    setShowBatchModal(true);
  };

  const openSMSModal = () => {
    setSmsMessage('');
    setShowSMSModal(true);
  };

  const checkBatchStatus = async (batchId) => {
    try {
      const resp = await ngoAPI.getBatchStatus(batchId);
      setBatchStatus(resp.data);
    } catch (err) {
      console.error('Failed to check batch status');
    }
  };

  const getImpactPercentage = () => {
    if (!dashboardData?.impact) return 0;
    return Math.round((dashboardData.impact.registered_count / dashboardData.impact.registered_target * 100));
  };

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage farmer registrations and outreach programs</p>
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

      {/* Impact Header */}
      <Card className="bg-gradient-to-br from-primary-50 to-earth-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {dashboardData?.impact?.registered_count || 0} / 5000
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Farmers Reached
          </p>
          <div className="w-full bg-white rounded-full h-4 mb-6">
            <div
              className="h-4 bg-primary-500 rounded-full transition-all"
              style={{ width: `${getImpactPercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Target: {dashboardData?.impact?.registered_target || 5000}</span>
            <span>{getImpactPercentage()}% Complete</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Counties Covered</p>
            <p className="text-2xl font-bold text-primary-700">
              {dashboardData?.impact?.counties_covered || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Crops Covered</p>
            <p className="text-2xl font-bold text-earth-700">
              {dashboardData?.impact?.crops_covered || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Registration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Registration Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Beneficiaries registered this month</span>
              <span className="font-bold text-gray-900">
                {stats?.registered_this_month || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active farmers</span>
              <span className="font-bold text-gray-900">
                {stats?.active_farmers || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Advisories delivered</span>
              <span className="font-bold text-gray-900">
                {stats?.advisories_delivered || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Trainings conducted</span>
              <span className="font-bold text-gray-900">
                {stats?.trainings_conducted || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Impact Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Reach</span>
              <span className="font-bold text-gray-900">
                {dashboardData?.impact?.registered_count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Engagement Rate</span>
              <span className="font-bold text-gray-900">
                {stats?.active_farmers ? Math.round((stats.active_farmers / dashboardData.impact.registered_count) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">SMS Delivery Rate</span>
              <span className="font-bold text-gray-900">
                {stats?.advisories_delivered ? Math.round((stats.advisories_delivered / stats.active_farmers) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Target Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Target</span>
              <span className="font-bold text-gray-900">
                {Math.round(5000 / 12)} per month
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Progress</span>
              <span className="font-bold text-gray-900">
                {getImpactPercentage()}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Time Remaining</span>
              <span className="font-bold text-gray-900">
                {Math.max(0, 12 - (getImpactPercentage() / 100 * 12))} months
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Batch Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Batch Management</h2>
          <Button onClick={openBatchModal}>
            <Plus className="w-4 h-4 mr-2" />
            New Batch
          </Button>
        </div>

        <div className="space-y-4">
          {batches.map((batch) => (
            <Card key={batch.id} className="border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{batch.batch_name}</h3>
                  <p className="text-sm text-gray-500">
                    {batch.county} • {batch.farmer_count} farmers
                  </p>
                  <p className="text-xs text-gray-400">
                    Created: {format(new Date(batch.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={batch.status === 'completed' ? 'success' : 'warning'}>
                    {batch.status}
                  </Badge>
                </div>
              </div>
              {batch.status === 'active' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 bg-primary-500 rounded-full transition-all"
                        style={{ 
                          width: `${(batch.processed / batch.farmer_count) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkBatchStatus(batch.id)}
                  >
                    Check Status
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>

      {/* Farmer Directory */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Farmer Directory</h2>
          <Button onClick={() => {/* TODO: Load more farmers */}}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="space-y-3">
          {farmers.map((farmer) => (
            <div key={farmer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{farmer.name}</p>
                <p className="text-sm text-gray-500">{farmer.phone} • {farmer.county}</p>
                <p className="text-xs text-gray-400">
                  {farmer.farms_count} farm{farmer.farms_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={farmer.subscription === 'pro' ? 'pro' : farmer.subscription === 'basic' ? 'basic' : 'free'}>
                  {farmer.subscription?.toUpperCase() || 'FREE'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {farmer.joined_at ? format(new Date(farmer.joined_at), 'MMM d, yyyy') : 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Send Advisory SMS */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Send Advisory SMS</h2>
          <Button onClick={openSMSModal}>
            <Send className="w-4 h-4 mr-2" />
            Send SMS
          </Button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Recent SMS campaigns reach {Math.round(farmers.length * 0.8)} farmers on average
            </p>
          </div>
        </div>
      </Card>

      {/* Product Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Create New Batch
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name</label>
                <input
                  type="text"
                  value={batchForm.batch_name}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, batch_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Nakuru East Farmers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                <select
                  value={batchForm.county}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, county: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select county</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Kiambu">Kiambu</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Eldoret">Eldoret</option>
                  <option value="Meru">Meru</option>
                  <option value="Thika">Thika</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Farmers (one per line)</label>
                <textarea
                  value={batchForm.farmers_text}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, farmers_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={6}
                  placeholder="0712345678, John Doe, Nakuru East&#10;0798765432, Mary Wanjiku, Nakuru East&#10;0798765432"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: Phone, First Name, Last Name, Sub-county
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop Filter</label>
                <select
                  value={batchForm.crop_filter}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, crop_filter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Crops</option>
                  <option value="maize">Maize</option>
                  <option value="beans">Beans</option>
                  <option value="potatoes">Potatoes</option>
                  <option value="tomatoes">Tomatoes</option>
                  <option value="tea">Tea</option>
                  <option value="wheat">Wheat</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Will register {batchForm.farmers_text.split('\n').filter(f => f.trim()).length || 0} farmers
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBatchModal(false);
                  resetBatchForm();
                }}
                size="full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBatch}
                disabled={!batchForm.batch_name.trim() || !batchForm.county || !batchForm.farmers_text.trim()}
                size="full"
              >
                Create Batch
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Advisory SMS</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Enter advisory message for farmers..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Will send to {farmers.length} farmers
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSMSModal(false);
                    setSmsMessage('');
                  }}
                  size="full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendSMS}
                  isLoading={sendingSMS}
                  disabled={!smsMessage.trim()}
                  size="full"
                >
                  Send SMS
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
