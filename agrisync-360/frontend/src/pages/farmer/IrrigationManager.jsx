import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { farmIntelAPI } from '../../api/farmIntel'
import { toast } from 'react-hot-toast'
import { Droplets, Plus, Check } from 'lucide-react'
import Button from '../../components/common/Button'

export default function IrrigationManager() {
  const { isAuthenticated } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [upcomingOnly, setUpcomingOnly] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    loadSchedules()
  }, [isAuthenticated, upcomingOnly])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const resp = await farmIntelAPI.listIrrigation({ upcoming: upcomingOnly })
      setSchedules(resp.data.data?.schedules || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id) => {
    try {
      await farmIntelAPI.completeIrrigation(id, {})
      toast.success('Irrigation marked complete')
      loadSchedules()
    } catch (error) {
      toast.error('Failed to complete')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'skipped': return 'bg-gray-100 text-gray-700'
      case 'postponed': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💧 Irrigation Manager</h1>
          <p className="text-gray-500 text-sm">Schedule and track irrigation</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Schedule
        </Button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setUpcomingOnly(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${!upcomingOnly ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          All Schedules
        </button>
        <button onClick={() => setUpcomingOnly(true)} className={`px-4 py-2 rounded-xl text-sm font-medium ${upcomingOnly ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Upcoming
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Irrigation Schedules</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {schedules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No irrigation schedules</div>
          ) : (
            schedules.map(schedule => (
              <div key={schedule.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{schedule.crop_name || 'General'}</p>
                    <p className="text-sm text-gray-500">{schedule.scheduled_date} at {schedule.scheduled_time || 'any time'}</p>
                    <p className="text-sm text-gray-500">{schedule.irrigation_type} • {schedule.water_source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(schedule.status)}`}>
                      {schedule.status}
                    </span>
                    {schedule.status === 'scheduled' && (
                      <button onClick={() => handleComplete(schedule.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {schedule.water_amount_litres && (
                  <div className="mt-2 text-sm text-gray-500">
                    Water: {schedule.water_amount_litres}L • Duration: {schedule.duration_minutes}min • Cost: KSH {schedule.cost_ksh}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-3xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule Irrigation</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const data = Object.fromEntries(formData)
              try {
                await farmIntelAPI.createIrrigation(data)
                toast.success('Irrigation scheduled')
                setShowAddModal(false)
                loadSchedules()
              } catch (error) {
                toast.error('Failed to schedule')
              }
            }} className="space-y-4">
              <input name="crop_name" placeholder="Crop Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <select name="irrigation_type" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="drip">Drip</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="furrow">Furrow</option>
                <option value="flood">Flood</option>
                <option value="manual">Manual</option>
              </select>
              <input name="scheduled_date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              <input name="scheduled_time" type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input name="duration_minutes" type="number" placeholder="Duration (min)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <input name="water_amount_litres" type="number" placeholder="Water (L)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
