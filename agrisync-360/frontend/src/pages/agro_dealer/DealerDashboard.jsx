import { useState, useEffect } from 'react';
import { 
  Package, Users, Send, TrendingUp, Plus, Edit2, Trash2, 
  RefreshCw, ChevronRight, Search, Filter
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { PageLoader } from '../../components/common/Loader';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { dealerAPI } from '../../api/dealer';

export default function DealerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'fertilizer',
    crop: 'maize',
    price_ksh: '',
    description: '',
    available: true
  });
  
  // Broadcast form
  const [broadcastForm, setBroadcastForm] = useState({
    message: '',
    crop_filter: 'all'
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResp, productsResp, farmersResp] = await Promise.all([
        dealerAPI.getStats(),
        dealerAPI.getProducts(),
        dealerAPI.getFarmers()
      ]);

      setStats(statsResp.data);
      setProducts(productsResp.data);
      setFarmers(farmersResp.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dealer dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim() || !productForm.price_ksh) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const resp = await dealerAPI.createProduct(productForm);
      setProducts(prev => [...prev, resp.data]);
      setShowProductModal(false);
      resetProductForm();
      toast.success('Product created successfully');
    } catch (err) {
      setError(err.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!productForm.name.trim() || !productForm.price_ksh) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const resp = await dealerAPI.updateProduct(editingProduct.id, productForm);
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? resp.data : p));
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      toast.success('Product updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await dealerAPI.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.message.trim()) {
      setError('Please enter a broadcast message');
      return;
    }

    setSendingBroadcast(true);
    setError('');

    try {
      const resp = await dealerAPI.sendBroadcast({
        message: broadcastForm.message,
        crop_filter: broadcastForm.crop_filter
      });
      toast.success(resp.message);
      setShowBroadcastModal(false);
      resetBroadcastForm();
    } catch (err) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      type: 'fertilizer',
      crop: 'maize',
      price_ksh: '',
      description: '',
      available: true
    });
  };

  const resetBroadcastForm = () => {
    setBroadcastForm({
      message: '',
      crop_filter: 'all'
    });
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        type: product.type,
        crop: product.crop,
        price_ksh: product.price_ksh.toString(),
        description: product.description,
        available: product.available
      });
    } else {
      setEditingProduct(null);
      resetProductForm();
    }
    setShowProductModal(true);
  };

  const getSubscriptionBadge = (subscription) => {
    switch (subscription) {
      case 'pro': return <Badge variant="pro">PRO</Badge>;
      case 'basic': return <Badge variant="basic">BASIC</Badge>;
      default: return <Badge variant="free">FREE</Badge>;
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agro-Dealer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage products and connect with farmers</p>
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
          title="Farmers in County"
          value={stats?.farmers?.in_county?.toLocaleString() || '0'}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Products Listed"
          value={stats?.products?.listed || '0'}
          icon={<Package className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Broadcasts Sent"
          value={stats?.broadcasts?.sent || '0'}
          icon={<Send className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <StatCard
          title="This Month"
          value={stats?.broadcasts?.this_month || '0'}
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* Product Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Product Management</h2>
          <Button onClick={() => openProductModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
        
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-earth-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-earth-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{product.type} • {product.crop}</p>
                      <p className="text-xs text-gray-400">{product.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-700">
                      KSH {product.price_ksh}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {product.available ? (
                        <Badge variant="success">Available</Badge>
                      ) : (
                        <Badge variant="warning">Out of Stock</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openProductModal(product)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Farmer Directory */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Farmer Directory</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search farmers..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              <option value="all">All Crops</option>
              <option value="maize">Maize</option>
              <option value="beans">Beans</option>
              <option value="potatoes">Potatoes</option>
              <option value="tomatoes">Tomatoes</option>
            </select>
          </div>
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
                {getSubscriptionBadge(farmer.subscription)}
                <p className="text-xs text-gray-500 mt-1">
                  {farmer.last_active ? format(new Date(farmer.last_active), 'MMM d') : 'Never'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Send Broadcast */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Send Broadcast</h2>
          <Button onClick={() => setShowBroadcastModal(true)}>
            <Send className="w-4 h-4 mr-2" />
            New Broadcast
          </Button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Recent broadcasts reach an average of {Math.round(farmers.length * 0.7)} farmers
            </p>
          </div>
        </div>
      </Card>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="fertilizer">Fertilizer</option>
                    <option value="pesticide">Pesticide</option>
                    <option value="herbicide">Herbicide</option>
                    <option value="seed">Seed</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
                  <select
                    value={productForm.crop}
                    onChange={(e) => setProductForm(prev => ({ ...prev, crop: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="maize">Maize</option>
                    <option value="beans">Beans</option>
                    <option value="potatoes">Potatoes</option>
                    <option value="tomatoes">Tomatoes</option>
                    <option value="tea">Tea</option>
                    <option value="wheat">Wheat</option>
                    <option value="cabbage">Cabbage</option>
                    <option value="kale">Kale</option>
                    <option value="onions">Onions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (KSH)</label>
                <input
                  type="number"
                  value={productForm.price_ksh}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price_ksh: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Enter product description"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Available</label>
                <button
                  onClick={() => setProductForm(prev => ({ ...prev, available: !prev.available }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    productForm.available ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    productForm.available ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                size="full"
              >
                Cancel
              </Button>
              <Button
                onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                size="full"
              >
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Broadcast</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Enter broadcast message for farmers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop Filter</label>
                <select
                  value={broadcastForm.crop_filter}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, crop_filter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Farmers</option>
                  <option value="maize">Maize Farmers</option>
                  <option value="beans">Beans Farmers</option>
                  <option value="potatoes">Potatoes Farmers</option>
                  <option value="tomatoes">Tomatoes Farmers</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Will send to {broadcastForm.crop_filter === 'all' ? 'all' : broadcastForm.crop_filter} farmers in your county
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBroadcastModal(false);
                    resetBroadcastForm();
                  }}
                  size="full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBroadcast}
                  isLoading={sendingBroadcast}
                  disabled={!broadcastForm.message.trim()}
                  size="full"
                >
                  Send Broadcast
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
