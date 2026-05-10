import { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Mail, Eye, ChevronRight, 
  Users, Calendar, DollarSign, CheckSquare, XSquare
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { PageLoader } from '../../components/common/Loader';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const kenyanCounties = [
  'All', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
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

export default function FarmerManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedFarmers, setSelectedFarmers] = useState(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // SMS modal
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);

  useEffect(() => {
    loadFarmers();
  }, [searchQuery, selectedCounty, selectedPlan, sortBy]);

  const loadFarmers = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        search: searchQuery,
        county: selectedCounty === 'All' ? '' : selectedCounty,
        plan: selectedPlan === 'All' ? '' : selectedPlan,
        sort: sortBy,
        page: 1
      };

      const resp = await adminAPI.getFarmers(params);
      setFarmers(resp.data.data);
      setPagination(resp.data.pagination);
    } catch (err) {
      setError('Failed to load farmers');
      console.error('Farmer management error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerSelect = (farmerId) => {
    const newSelected = new Set(selectedFarmers);
    if (newSelected.has(farmerId)) {
      newSelected.delete(farmerId);
    } else {
      newSelected.add(farmerId);
    }
    setSelectedFarmers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFarmers.size === farmers.length) {
      setSelectedFarmers(new Set());
    } else {
      setSelectedFarmers(new Set(farmers.map(f => f.id)));
    }
  };

  const handleViewFarmer = async (farmer) => {
    try {
      const resp = await adminAPI.getFarmerDetails(farmer.id);
      setSelectedFarmer(resp.data);
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to load farmer details');
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
      const resp = await adminAPI.sendBulkSMS({
        message: smsMessage,
        farmer_ids: Array.from(selectedFarmers)
      });
      toast.success(resp.message);
      setShowSMSModal(false);
      setSmsMessage('');
      setSelectedFarmers(new Set());
    } catch (err) {
      setError(err.message || 'Failed to send SMS');
    } finally {
      setSendingSMS(false);
    }
  };

  const handleExport = async () => {
    try {
      const resp = await adminAPI.exportFarmers({
        county: selectedCounty === 'All' ? '' : selectedCounty,
        plan: selectedPlan === 'All' ? '' : selectedPlan
      });
      
      // Create download link
      const link = document.createElement('a');
      link.href = resp.download_url;
      link.download = 'farmers_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Farmers exported successfully');
    } catch (err) {
      setError('Failed to export farmers');
    }
  };

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'pro': return <Badge variant="pro">PRO</Badge>;
      case 'basic': return <Badge variant="basic">BASIC</Badge>;
      default: return <Badge variant="free">FREE</Badge>;
    }
  };

  if (loading) {
    return <PageLoader message="Loading farmers..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmer Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor registered farmers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={farmers.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />
      )}

      {/* Search and Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            {kenyanCounties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
          
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="All">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="county">County</option>
          </select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedFarmers.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">
                {selectedFarmers.size} farmer{selectedFarmers.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSMSModal(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send SMS
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedFarmers(new Set())}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <XSquare className="w-4 h-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Farmers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFarmers.size === farmers.length && farmers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
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
              {farmers.map((farmer) => (
                <tr key={farmer.id} className={farmer.is_active ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedFarmers.has(farmer.id)}
                      onChange={() => handleFarmerSelect(farmer.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{farmer.name}</p>
                      <p className="text-sm text-gray-500">
                        {farmer.farms_count} farm{farmer.farms_count !== 1 ? 's' : ''} • {farmer.crops_count} crop{farmer.crops_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="text-gray-900">{farmer.phone}</p>
                      <p className="text-sm text-gray-500">{farmer.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="text-gray-900 capitalize">{farmer.county}</p>
                      <p className="text-sm text-gray-500">{farmer.sub_county}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getPlanBadge(farmer.plan)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        farmer.is_active ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {farmer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {farmer.last_active ? format(new Date(farmer.last_active), 'MMM d') : 'Never'}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {farmer.joined_at ? format(new Date(farmer.joined_at), 'MMM d, yyyy') : 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFarmer(farmer)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: Send individual SMS */}}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {farmers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No farmers found matching your criteria</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => {/* TODO: Previous page */}}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => {/* TODO: Next page */}}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Farmer Details Modal */}
      {showDetailsModal && selectedFarmer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Farmer Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
              >
                <XSquare className="w-4 h-4" />
              </Button>
            </div>

            {/* Profile Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900 mb-3">Profile Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedFarmer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedFarmer.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedFarmer.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">County</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedFarmer.county}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sub-County</p>
                      <p className="font-medium text-gray-900">{selectedFarmer.sub_county}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ward</p>
                      <p className="font-medium text-gray-900">{selectedFarmer.ward || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Village</p>
                      <p className="font-medium text-gray-900">{selectedFarmer.village || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Plan</p>
                      <div>{getPlanBadge(selectedFarmer.plan)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-blue-800 text-sm font-medium">Farms</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedFarmer.farms_count}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium">Crops</p>
                    <p className="text-2xl font-bold text-green-900">{selectedFarmer.crops_count}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-purple-800 text-sm font-medium">Status</p>
                    <p className="font-bold text-purple-900 capitalize">
                      {selectedFarmer.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Farms Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Farms ({selectedFarmer.farms?.length || 0})</h3>
              <div className="space-y-3">
                {selectedFarmer.farms?.map((farm) => (
                  <Card key={farm.id} className="border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{farm.name}</p>
                        <p className="text-sm text-gray-500">
                          {farm.size_acres} acres • {farm.county}
                        </p>
                        <p className="text-xs text-gray-400">
                          {farm.latitude?.toFixed(4)}, {farm.longitude?.toFixed(4)}
                        </p>
                      </div>
                      {farm.is_primary && (
                        <Badge variant="success">Primary</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Payment History */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Plan
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Receipt
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFarmer.payments?.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-2">
                          {getPlanBadge(payment.plan)}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          KSH {payment.amount}
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-sm">
                          {payment.receipt_number}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-sm">
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SMS History */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">SMS History</h3>
              <div className="space-y-2">
                {selectedFarmer.sms_history?.map((sms) => (
                  <Card key={sms.id} className="border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{sms.message}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(sms.sent_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Badge variant={sms.status === 'delivered' ? 'success' : 'warning'}>
                        {sms.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Send SMS to {selectedFarmers.size} farmer{selectedFarmers.size > 1 ? 's' : ''}
            </h3>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="Enter SMS message..."
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              maxLength={160}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{smsMessage.length}/160 characters</span>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowSMSModal(false)}
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
          </Card>
        </div>
      )}
    </div>
  );
}
