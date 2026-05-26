import React, { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Clock, Trash2, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { farmIntelAPI } from '../../api/farmIntel'
import { toast } from 'react-hot-toast'
import Button from '../../components/common/Button'

const CROPS = [
  { name: 'maize', emoji: '🌽', color: '#F59E0B' },
  { name: 'beans', emoji: '🫘', color: '#8B5CF6' },
  { name: 'tomatoes', emoji: '🍅', color: '#EF4444' },
  { name: 'potatoes', emoji: '🥔', color: '#D97706' },
  { name: 'kale', emoji: '🥬', color: '#10B981' },
  { name: 'cabbage', emoji: '🥬', color: '#059669' },
  { name: 'onions', emoji: '🧅', color: '#FCD34D' },
  { name: 'sorghum', emoji: '🌾', color: '#78350F' },
  { name: 'wheat', emoji: '🌾', color: '#D4A574' },
  { name: 'rice', emoji: '🍚', color: '#F5F5DC' },
]

const STATUS_CONFIG = {
  planned: { icon: '📋', label: 'Planned', color: 'bg-gray-100 text-gray-700' },
  planted: { icon: '🌱', label: 'Planted', color: 'bg-green-100 text-green-700' },
  growing: { icon: '🌿', label: 'Growing', color: 'bg-emerald-100 text-emerald-700' },
  harvested: { icon: '🌾', label: 'Harvested', color: 'bg-amber-100 text-amber-700' },
  failed: { icon: '❌', label: 'Failed', color: 'bg-red-100 text-red-700' },
  cancelled: { icon: '🚫', label: 'Cancelled', color: 'bg-gray-200 text-gray-600' },
}

function AddEntryModal({ onClose, onSuccess, selectedDate }) {
  const [form, setForm] = useState({
    crop_name: '',
    variety: '',
    planned_planting_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    planned_harvest_date: '',
    area_acres: 1,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const resp = await farmIntelAPI.createCalendarEntry(form)
      toast.success('Calendar entry added')
      onSuccess(resp.data.data)
      onClose()
    } catch (error) {
      toast.error('Failed to add entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-3xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add Planting Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop *</label>
            <select
              value={form.crop_name}
              onChange={e => setForm(f => ({ ...f, crop_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select crop</option>
              {CROPS.map(crop => (
                <option key={crop.name} value={crop.name}>{crop.emoji} {crop.name}</option>
              ))}
            </select>
          </div>
          <input
            placeholder="Variety (optional)"
            value={form.variety}
            onChange={e => setForm(f => ({ ...f, variety: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date *</label>
              <input
                type="date"
                value={form.planned_planting_date}
                onChange={e => setForm(f => ({ ...f, planned_planting_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Harvest</label>
              <input
                type="date"
                value={form.planned_harvest_date}
                onChange={e => setForm(f => ({ ...f, planned_harvest_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (acres)</label>
            <input
              type="number"
              step="0.1"
              value={form.area_acres}
              onChange={e => setForm(f => ({ ...f, area_acres: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" isLoading={submitting} className="flex-1">Add Entry</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PlantingCalendar() {
  const { isAuthenticated } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [view, setView] = useState('calendar')

  useEffect(() => {
    if (!isAuthenticated) return
    loadCalendar()
  }, [isAuthenticated])

  const loadCalendar = async () => {
    setLoading(true)
    try {
      const resp = await farmIntelAPI.listCalendar()
      setEntries(resp.data.data?.entries || [])
    } catch (error) {
      console.error('Calendar load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }

  const getEntriesForDate = (day) => {
    return entries.filter(entry => {
      const plantDate = entry.planned_planting_date ? parseISO(entry.planned_planting_date) : null
      const harvestDate = entry.planned_harvest_date ? parseISO(entry.planned_harvest_date) : null
      return (plantDate && isSameDay(plantDate, day)) || (harvestDate && isSameDay(harvestDate, day))
    })
  }

  const getCropConfig = (cropName) => {
    return CROPS.find(c => c.name === cropName) || { emoji: '🌱', color: '#2D6A4F' }
  }

  const handleUpdateStatus = async (entryId, status) => {
    try {
      await farmIntelAPI.updateCalendarEntry(entryId, { status })
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status } : e))
      toast.success(`Status updated to ${status}`)
    } catch (error) {
      toast.error('Update failed')
    }
  }

  const handleDelete = async (entryId) => {
    try {
      await farmIntelAPI.deleteCalendarEntry(entryId)
      setEntries(prev => prev.filter(e => e.id !== entryId))
      setSelectedEntry(null)
      toast.success('Entry deleted')
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  const days = getDaysInMonth()
  const firstDayOfWeek = startOfMonth(currentMonth).getDay()
  const upcomingEntries = entries.filter(e => {
    if (!e.planned_planting_date) return false
    const d = parseISO(e.planned_planting_date)
    const today = new Date()
    return d >= today && (d - today) / (1000 * 60 * 60 * 24) <= 14
  }).sort((a, b) => new Date(a.planned_planting_date) - new Date(b.planned_planting_date))

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 lg:pb-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌱 Planting Calendar</h1>
          <p className="text-gray-500 text-sm">Plan and track your planting schedule</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Add Entry
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-xs">
        {['calendar', 'list'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${view === v ? 'bg-white shadow text-primary-700' : 'text-gray-600'}`}
          >
            {v === 'calendar' ? '📅 Calendar' : '📋 List'}
          </button>
        ))}
      </div>

      {upcomingEntries.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-primary-800 mb-3 flex items-center gap-2">
            <Clock size={16} /> Upcoming Planting ({upcomingEntries.length})
          </p>
          <div className="space-y-2">
            {upcomingEntries.slice(0, 3).map(entry => {
              const crop = getCropConfig(entry.crop_name)
              return (
                <div key={entry.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 shadow-sm">
                  <span className="text-lg">{crop.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 capitalize">{entry.crop_name}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(entry.planned_planting_date), 'MMMM d, yyyy')} • {entry.area_acres} acres</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary-600">{entry.days_to_plant === 0 ? 'Today!' : `${entry.days_to_plant}d`}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'calendar' ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <h3 className="text-base font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-gray-400 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/50" />
            ))}
            {days.map((day, i) => {
              const dayEntries = getEntriesForDate(day)
              const isCurrentDay = isToday(day)
              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDate(day)
                    if (dayEntries.length > 0) setSelectedEntry(dayEntries[0])
                    else setShowAddModal(true)
                  }}
                  className={`min-h-[80px] p-1.5 border-b border-r border-gray-100 cursor-pointer transition-colors ${isCurrentDay ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${isCurrentDay ? 'bg-primary-600 text-white' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEntries.slice(0, 2).map(entry => {
                      const crop = getCropConfig(entry.crop_name)
                      const isHarvest = entry.planned_harvest_date && isSameDay(parseISO(entry.planned_harvest_date), day)
                      return (
                        <div key={entry.id} className="text-xs px-1.5 py-0.5 rounded-lg truncate font-medium" style={{ backgroundColor: `${crop.color}22`, color: crop.color }}>
                          {isHarvest ? '🌾' : crop.emoji} {entry.crop_name}
                        </div>
                      )
                    })}
                    {dayEntries.length > 2 && <div className="text-xs text-gray-400 px-1">+{dayEntries.length - 2} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
              <span className="text-4xl block mb-3">📅</span>
              <p className="font-semibold text-gray-700 mb-1">No entries yet</p>
              <p className="text-gray-400 text-sm mb-4">Add your first planting plan</p>
              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddModal(true)}>Add Entry</Button>
            </div>
          ) : (
            entries.map(entry => {
              const crop = getCropConfig(entry.crop_name)
              const status = STATUS_CONFIG[entry.status] || STATUS_CONFIG.planned
              return (
                <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-primary-200 cursor-pointer transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `${crop.color}22` }}>
                      {crop.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-gray-900 capitalize text-sm">{entry.crop_name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.icon} {status.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {entry.planned_planting_date && <span>🌱 Plant: {format(parseISO(entry.planned_planting_date), 'MMM d, yyyy')}</span>}
                        {entry.planned_harvest_date && <span>🌾 Harvest: {format(parseISO(entry.planned_harvest_date), 'MMM d, yyyy')}</span>}
                        <span>📐 {entry.area_acres} acres</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEntry(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-3xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCropConfig(selectedEntry.crop_name).emoji}</span>
                <div>
                  <h3 className="font-bold text-gray-900 capitalize">{selectedEntry.crop_name}</h3>
                  <p className="text-xs text-gray-500">{selectedEntry.area_acres} acres</p>
                </div>
              </div>
              <button onClick={() => setSelectedEntry(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => handleUpdateStatus(selectedEntry.id, key)} className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${selectedEntry.status === key ? cfg.color + ' border-2 border-current' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => handleDelete(selectedEntry.id)} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-600 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-xl hover:bg-red-50 transition-colors">
              <Trash2 size={14} /> Delete Entry
            </button>
          </div>
        </div>
      )}

      {showAddModal && <AddEntryModal onClose={() => setShowAddModal(false)} onSuccess={(entry) => setEntries(prev => [...prev, entry])} selectedDate={selectedDate} />}
    </div>
  )
}
