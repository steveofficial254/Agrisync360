import React, { useState, useEffect } from 'react';
import {
  Users, Target, Send, BarChart3, TrendingUp, RefreshCw,
  Plus, Upload, Calendar, MapPin, Users2, CheckCircle,
  AlertTriangle, Download, Trash2
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

      // Handle both mock API format (success: true, data: {}) and direct format
      setDashboardData(dashboardResp.data?.success ? dashboardResp.data.data : dashboardResp.data);
      setStats(statsResp.data?.success ? statsResp.data.data : statsResp.data);
      setBatches(batchesResp.data?.success ? batchesResp.data.data : batchesResp.data);
      setFarmers(farmersResp.data?.success ? farmersResp.data.data : farmersResp.data);
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

      const newBatch = resp.data?.success ? resp.data.data : resp.data;
      setBatches(prev => Array.isArray(prev) ? [...prev, newBatch] : [newBatch]);
      setShowBatchModal(false);
      resetBatchForm();
      toast.success(resp.data?.message || 'Batch created successfully');
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
        farmer_ids: Array.isArray(farmers) ? farmers.map(f => f.id) : []
      });
      toast.success(resp.data?.message || resp.message || 'SMS sent successfully');
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
      setBatchStatus(resp.data?.success ? resp.data.data : resp.data);
    } catch (err) {
      console.error('Failed to check batch status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const resp = await ngoAPI.exportFarmersCSV();
      const data = resp.data?.success ? resp.data.data : resp.data;

      // Create download link
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename || 'farmers_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exported successfully');
    } catch (err) {
      setError(err.message || 'Failed to export CSV');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    try {
      const resp = await ngoAPI.deleteBatch(batchId);
      toast.success(resp.data?.message || 'Batch deleted successfully');
      setBatches(prev => Array.isArray(prev) ? prev.filter(b => b.id !== batchId) : []);
    } catch (err) {
      setError(err.message || 'Failed to delete batch');
    }
  };

  const getImpactPercentage = () => {
    if (!dashboardData?.impact?.registered_count || !dashboardData?.impact?.registered_target) return 0;
    return Math.round((dashboardData.impact.registered_count / dashboardData.impact.registered_target * 100));
  };

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              NGO Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Manage farmer registrations and outreach programs</p>
          </div>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            isLoading={loading}
            className="shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* Impact Header */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 shadow-xl border border-emerald-200">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            {dashboardData?.impact?.registered_count || 0} / {dashboardData?.impact?.registered_target || 5000}
          </h2>
          <p className="text-xl text-gray-700 mb-6 font-medium">
            Farmers Reached
          </p>
          <div className="w-full bg-white rounded-full h-5 mb-6 shadow-inner">
            <div
              className="h-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${getImpactPercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 font-medium">
            <span>Target: {dashboardData?.impact?.registered_target || 5000}</span>
            <span className="text-emerald-700 font-bold">{getImpactPercentage()}% Complete</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div className="text-center bg-white/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-gray-600 font-medium">Counties Covered</p>
            <p className="text-3xl font-bold text-emerald-700">
              {dashboardData?.impact?.counties_covered || 0}
            </p>
          </div>
          <div className="text-center bg-white/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-gray-600 font-medium">Crops Covered</p>
            <p className="text-3xl font-bold text-teal-700">
              {dashboardData?.impact?.crops_covered || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Registration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Registration Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Registered this month</span>
              <span className="font-bold text-emerald-700 text-lg">
                {stats?.registered_this_month || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Active farmers</span>
              <span className="font-bold text-emerald-700 text-lg">
                {stats?.active_farmers || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Advisories delivered</span>
              <span className="font-bold text-emerald-700 text-lg">
                {stats?.advisories_delivered || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Trainings conducted</span>
              <span className="font-bold text-emerald-700 text-lg">
                {stats?.trainings_conducted || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Impact Metrics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Total Reach</span>
              <span className="font-bold text-blue-700 text-lg">
                {dashboardData?.impact?.registered_count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Engagement Rate</span>
              <span className="font-bold text-blue-700 text-lg">
                {stats?.active_farmers && dashboardData?.impact?.registered_count ? Math.round((stats.active_farmers / dashboardData.impact.registered_count) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">SMS Delivery Rate</span>
              <span className="font-bold text-blue-700 text-lg">
                {stats?.advisories_delivered && stats?.active_farmers ? Math.round((stats.advisories_delivered / stats.active_farmers) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Target Progress</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Monthly Target</span>
              <span className="font-bold text-purple-700 text-lg">
                {Math.round(5000 / 12)} per month
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Current Progress</span>
              <span className="font-bold text-purple-700 text-lg">
                {getImpactPercentage()}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Time Remaining</span>
              <span className="font-bold text-purple-700 text-lg">
                {Math.max(0, 12 - (getImpactPercentage() / 100 * 12))} months
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Batch Management */}
      <Card className="shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Batch Management</h2>
          <Button
            onClick={openBatchModal}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Batch
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(batches) && batches.map((batch) => (
            <Card key={batch.id} className="border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
                    <Users2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <Badge variant={batch.status === 'completed' ? 'success' : 'warning'} className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {batch.status}
                  </Badge>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{batch.batch_name}</h3>
                <p className="text-sm text-gray-600 mb-1">{batch.county}</p>
                <p className="text-xs text-gray-500 mb-4">
                  {batch.farmer_count} farmers • Created: {format(new Date(batch.created_at), 'MMM d, yyyy')}
                </p>
                {batch.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Progress:</span>
                      <span className="text-emerald-700 font-bold">{Math.round((batch.processed / batch.farmer_count) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                      <div
                        className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                        style={{
                          width: `${(batch.processed / batch.farmer_count) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkBatchStatus(batch.id)}
                        className="flex-1 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                      >
                        Check Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {batch.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="w-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Batch
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Farmer Directory */}
      <Card className="shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Farmer Directory</h2>
          <Button
            onClick={handleExportCSV}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(farmers) && farmers.map((farmer) => (
            <Card key={farmer.id} className="border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Badge variant={farmer.subscription === 'pro' ? 'pro' : farmer.subscription === 'basic' ? 'basic' : 'free'} className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {farmer.subscription?.toUpperCase() || 'FREE'}
                  </Badge>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{farmer.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{farmer.phone}</p>
                <p className="text-xs text-gray-500 mb-3">{farmer.county}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {farmer.farms_count} farm{farmer.farms_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-500">
                    {farmer.joined_at ? format(new Date(farmer.joined_at), 'MMM d, yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Send Advisory SMS */}
      <Card className="shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Send Advisory SMS</h2>
          <Button
            onClick={openSMSModal}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Send className="w-4 h-4 mr-2" />
            Send SMS
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <p className="text-emerald-800 text-sm font-medium">
              Recent SMS campaigns reach {Math.round(farmers.length * 0.8)} farmers on average
            </p>
          </div>
        </div>
      </Card>

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
              Create New Batch
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name</label>
                <input
                  type="text"
                  value={batchForm.batch_name}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, batch_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="e.g., Nakuru East Farmers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                <select
                  value={batchForm.county}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, county: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl">
                <p className="text-emerald-800 text-sm font-medium">
                  Will register {batchForm.farmers_text.split('\n').filter(f => f.trim()).length || 0} farmers
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBatchModal(false);
                  resetBatchForm();
                }}
                size="full"
                className="hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBatch}
                disabled={!batchForm.batch_name.trim() || !batchForm.county || !batchForm.farmers_text.trim()}
                size="full"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create Batch
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">Send Advisory SMS</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  rows={4}
                  placeholder="Enter advisory message for farmers..."
                />
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl">
                <p className="text-emerald-800 text-sm font-medium">
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
                  className="hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendSMS}
                  isLoading={sendingSMS}
                  disabled={!smsMessage.trim()}
                  size="full"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
