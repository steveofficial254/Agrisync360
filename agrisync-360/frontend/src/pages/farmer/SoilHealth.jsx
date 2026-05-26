import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { farmIntelAPI } from '../../api/farmIntel'
import { toast } from 'react-hot-toast'
import { Leaf, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import Button from '../../components/common/Button'

export default function SoilHealth() {
  const { isAuthenticated } = useAuth()
  const [records, setRecords] = useState([])
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    loadRecords()
  }, [isAuthenticated])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const resp = await farmIntelAPI.listSoilRecords()
      setRecords(resp.data.data?.records || [])
      setLatest(resp.data.data?.latest || null)
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPHColor = (ph) => {
    if (!ph) return 'bg-gray-100'
    if (ph < 5.5) return 'bg-red-100 text-red-700'
    if (ph > 7.5) return 'bg-blue-100 text-blue-700'
    return 'bg-green-100 text-green-700'
  }

  const getPHLabel = (ph) => {
    if (!ph) return 'Unknown'
    if (ph < 5.5) return 'Acidic'
    if (ph > 7.5) return 'Alkaline'
    return 'Optimal'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌱 Soil Health Tracker</h1>
          <p className="text-gray-500 text-sm">Track soil test results and recommendations</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Add Test
        </Button>
      </div>

      {latest && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Latest Test Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">pH Level</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getPHColor(latest.ph_level)}`}>
                {latest.ph_level || 'N/A'} - {getPHLabel(latest.ph_level)}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Nitrogen (N)</p>
              <p className="text-lg font-bold text-gray-900">{latest.nitrogen_ppm || 'N/A'} ppm</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Phosphorus (P)</p>
              <p className="text-lg font-bold text-gray-900">{latest.phosphorus_ppm || 'N/A'} ppm</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Potassium (K)</p>
              <p className="text-lg font-bold text-gray-900">{latest.potassium_ppm || 'N/A'} ppm</p>
            </div>
          </div>
          {latest.ai_recommendations && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl">
              <p className="text-sm font-semibold text-primary-800 mb-2">🤖 AI Recommendations</p>
              <p className="text-sm text-gray-700">{latest.ai_recommendations}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Test History</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No soil tests recorded</div>
          ) : (
            records.map(record => (
              <div key={record.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{record.test_date}</p>
                    {record.lab_name && <p className="text-sm text-gray-500">{record.lab_name}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPHColor(record.ph_level)}`}>
                    pH: {record.ph_level}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                  <div><span className="text-gray-500">N:</span> {record.nitrogen_ppm || 'N/A'}</div>
                  <div><span className="text-gray-500">P:</span> {record.phosphorus_ppm || 'N/A'}</div>
                  <div><span className="text-gray-500">K:</span> {record.potassium_ppm || 'N/A'}</div>
                  <div><span className="text-gray-500">Texture:</span> {record.soil_texture || 'N/A'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-3xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Soil Test</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const data = Object.fromEntries(formData)
              try {
                await farmIntelAPI.addSoilRecord({ ...data, get_ai_recommendations: true })
                toast.success('Soil test added')
                setShowAddModal(false)
                loadRecords()
              } catch (error) {
                toast.error('Failed to add test')
              }
            }} className="space-y-4">
              <input name="test_date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              <input name="lab_name" placeholder="Lab Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <div className="grid grid-cols-4 gap-2">
                <input name="ph_level" type="number" step="0.1" placeholder="pH" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <input name="nitrogen_ppm" type="number" placeholder="N ppm" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <input name="phosphorus_ppm" type="number" placeholder="P ppm" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <input name="potassium_ppm" type="number" placeholder="K ppm" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <select name="soil_texture" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select soil texture</option>
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="clay">Clay</option>
                <option value="silty">Silty</option>
              </select>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Add Test</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
