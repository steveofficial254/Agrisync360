import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { marketProAPI } from '../../api/marketPro'
import { toast } from 'react-hot-toast'
import { TrendingUp, Building2, Bell, Plus, Search, X } from 'lucide-react'
import Button from '../../components/common/Button'

export default function MarketPro() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('buyers')
  const [alerts, setAlerts] = useState([])
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [searchBuyer, setSearchBuyer] = useState('')
  const [filterCrop, setFilterCrop] = useState('')
  const [selectedBuyer, setSelectedBuyer] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    if (activeTab === 'alerts') loadAlerts()
    else loadBuyers()
  }, [isAuthenticated, activeTab, searchBuyer, filterCrop])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const resp = await marketProAPI.listAlerts()
      setAlerts(resp.data.data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBuyers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterCrop) params.crop = filterCrop
      const resp = await marketProAPI.listBuyers(params)
      setBuyers(resp.data.data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    try {
      await marketProAPI.createAlert(data)
      toast.success('Price alert created')
      setShowAlertModal(false)
      loadAlerts()
    } catch (error) {
      toast.error('Failed to create alert')
    }
  }

  const handleDeleteAlert = async (id) => {
    try {
      await marketProAPI.deleteAlert(id)
      toast.success('Alert deleted')
      loadAlerts()
    } catch (error) {
      toast.error('Failed to delete alert')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Market Intelligence Pro</h1>
        <p className="text-gray-500 text-sm">Price alerts and buyer directory</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('buyers')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${activeTab === 'buyers' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Building2 size={16} /> Buyer Directory
        </button>
        <button onClick={() => setActiveTab('alerts')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${activeTab === 'alerts' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Bell size={16} /> Price Alerts
        </button>
      </div>

      {activeTab === 'buyers' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchBuyer}
                onChange={e => setSearchBuyer(e.target.value)}
                placeholder="Search buyers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl"
              />
            </div>
            <select value={filterCrop} onChange={e => setFilterCrop(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-xl">
              <option value="">All Crops</option>
              <option value="maize">Maize</option>
              <option value="tomatoes">Tomatoes</option>
              <option value="potatoes">Potatoes</option>
              <option value="beans">Beans</option>
              <option value="kale">Kale</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buyers.length === 0 ? (
              <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-500">
                No buyers found
              </div>
            ) : (
              buyers.filter(b => !searchBuyer || b.business_name.toLowerCase().includes(searchBuyer.toLowerCase())).map(buyer => (
                <div
                  key={buyer.id}
                  onClick={() => setSelectedBuyer(buyer)}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-primary-200 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{buyer.business_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{buyer.buyer_type}</p>
                    </div>
                    {buyer.is_verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Verified</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(buyer.crops_wanted || []).slice(0, 4).map(crop => (
                      <span key={crop} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg capitalize">{crop}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Min: {buyer.minimum_quantity_ksh || 'N/A'} kg • {buyer.payment_terms}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{alerts.length} alerts configured</p>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAlertModal(true)}>
              Create Alert
            </Button>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-500">
                No price alerts configured
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900 capitalize">{alert.crop_name}</p>
                    <p className="text-sm text-gray-500">
                      Alert when price {alert.condition} KSH {alert.target_price_ksh}
                      {alert.county && ` in ${alert.county}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${alert.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {alert.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => handleDeleteAlert(alert.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAlertModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-3xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Price Alert</h3>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <select name="crop_name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Select crop</option>
                <option value="maize">Maize</option>
                <option value="tomatoes">Tomatoes</option>
                <option value="potatoes">Potatoes</option>
                <option value="beans">Beans</option>
                <option value="kale">Kale</option>
                <option value="cabbage">Cabbage</option>
                <option value="onions">Onions</option>
              </select>
              <input name="target_price_ksh" type="number" placeholder="Target price (KSH)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              <select name="condition" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="above">Alert when price goes above</option>
                <option value="below">Alert when price goes below</option>
                <option value="equals">Alert when price equals</option>
              </select>
              <input name="county" placeholder="County (optional)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAlertModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Create Alert</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedBuyer(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedBuyer.business_name}</h2>
                <p className="text-sm text-gray-500 capitalize">{selectedBuyer.buyer_type}</p>
              </div>
              {selectedBuyer.is_verified && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Verified</span>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Contact:</span> {selectedBuyer.contact_name || 'N/A'}</div>
                <div><span className="text-gray-500">Phone:</span> {selectedBuyer.phone || 'N/A'}</div>
                <div><span className="text-gray-500">Email:</span> {selectedBuyer.email || 'N/A'}</div>
                <div><span className="text-gray-500">Min Qty:</span> {selectedBuyer.minimum_quantity_kg || 'N/A'} kg</div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Crops Wanted</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedBuyer.crops_wanted || []).map(crop => (
                    <span key={crop} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-lg capitalize">{crop}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Counties Served</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedBuyer.counties_served || []).map(county => (
                    <span key={county} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg capitalize">{county}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Payment Terms</h3>
                <p className="text-sm text-gray-600">{selectedBuyer.payment_terms || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quality Requirements</h3>
                <p className="text-sm text-gray-600">{selectedBuyer.quality_requirements || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
