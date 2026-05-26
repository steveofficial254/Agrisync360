import React, { useState, useEffect } from 'react'
import { farmIntelAPI } from '../../api/farmIntel'
import { Bug, Search } from 'lucide-react'

export default function PestLibrary() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCrop, setFilterCrop] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)

  useEffect(() => {
    loadEntries()
  }, [search, filterType, filterCrop])

  const loadEntries = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterType) params.type = filterType
      if (filterCrop) params.crop = filterCrop
      const resp = await farmIntelAPI.searchPestLibrary(params)
      setEntries(resp.data.data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'low': return { color: 'bg-blue-50 border-blue-100', badge: 'bg-blue-100 text-blue-700', label: 'Low' }
      case 'medium': return { color: 'bg-amber-50 border-amber-100', badge: 'bg-amber-100 text-amber-700', label: 'Medium' }
      case 'high': return { color: 'bg-orange-50 border-orange-100', badge: 'bg-orange-100 text-orange-700', label: 'High' }
      case 'critical': return { color: 'bg-red-50 border-red-100', badge: 'bg-red-100 text-red-700', label: 'Critical' }
      default: return { color: 'bg-gray-50 border-gray-100', badge: 'bg-gray-100 text-gray-700', label: 'Unknown' }
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pest': return '🐛'
      case 'disease': return '🦠'
      case 'weed': return '🌿'
      case 'deficiency': return '⚠️'
      default: return '❓'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🐛 Pest & Disease Library</h1>
        <p className="text-gray-500 text-sm">Searchable database of pests, diseases, and treatments</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search pests, diseases, symptoms..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-xl">
          <option value="">All Types</option>
          <option value="pest">Pests</option>
          <option value="disease">Diseases</option>
          <option value="weed">Weeds</option>
          <option value="deficiency">Deficiencies</option>
        </select>
        <select value={filterCrop} onChange={e => setFilterCrop(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-xl">
          <option value="">All Crops</option>
          <option value="maize">Maize</option>
          <option value="tomatoes">Tomatoes</option>
          <option value="potatoes">Potatoes</option>
          <option value="beans">Beans</option>
          <option value="kale">Kale</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-500">
            No entries found
          </div>
        ) : (
          entries.map(entry => {
            const cfg = getSeverityConfig(entry.severity)
            return (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={`${cfg.color} border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(entry.type)}</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{entry.name}</p>
                      {entry.local_name && <p className="text-xs text-gray-500">{entry.local_name}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{entry.symptoms}</p>
                <div className="flex flex-wrap gap-1">
                  {(entry.affected_crops || []).slice(0, 3).map(crop => (
                    <span key={crop} className="text-xs bg-white/80 border border-gray-200 px-2 py-0.5 rounded-lg capitalize text-gray-600">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEntry(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTypeIcon(selectedEntry.type)}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedEntry.name}</h2>
                  {selectedEntry.scientific_name && <p className="text-sm text-gray-500 italic">{selectedEntry.scientific_name}</p>}
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getSeverityConfig(selectedEntry.severity).badge}`}>
                {getSeverityConfig(selectedEntry.severity).label}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Symptoms</h3>
                <p className="text-sm text-gray-600">{selectedEntry.symptoms}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Affected Crops</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedEntry.affected_crops || []).map(crop => (
                    <span key={crop} className="text-xs bg-gray-100 px-2 py-1 rounded-lg capitalize">{crop}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Organic Control</h3>
                <p className="text-sm text-gray-600">{selectedEntry.organic_control || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Chemical Control</h3>
                <p className="text-sm text-gray-600">{selectedEntry.chemical_control || 'Not specified'}</p>
              </div>
              {selectedEntry.kenya_products && selectedEntry.kenya_products.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Kenya Products</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.kenya_products.map(product => (
                      <span key={product} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-lg">{product}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Prevention</h3>
                <p className="text-sm text-gray-600">{selectedEntry.prevention || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
