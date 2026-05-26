import React, { useState } from 'react';
import { yieldsAPI } from '../../api/yields';
import Button from '../../components/common/Button';

export default function YieldTracker() {
  const [formData, setFormData] = useState({ crop_name: '', area_planted_acres: '', quantity_harvested_kg: '', generate_ai_summary: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');
    
    try {
      const payload = {
        ...formData,
        area_planted_acres: parseFloat(formData.area_planted_acres),
        quantity_harvested_kg: parseFloat(formData.quantity_harvested_kg)
      };
      const res = await yieldsAPI.createYield(payload);
      if (res.data?.success) {
        setSuccess('Yield record created successfully!');
        setFormData({ crop_name: '', area_planted_acres: '', quantity_harvested_kg: '', generate_ai_summary: false });
      }
    } catch (err) {
      setError(err.message || 'Failed to record yield');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Yield Tracker</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{success}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Crop Name</label>
            <input type="text" className="w-full border p-2 rounded" value={formData.crop_name} onChange={e => setFormData({...formData, crop_name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Area Planted (Acres)</label>
            <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.area_planted_acres} onChange={e => setFormData({...formData, area_planted_acres: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity Harvested (kg)</label>
            <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.quantity_harvested_kg} onChange={e => setFormData({...formData, quantity_harvested_kg: e.target.value})} required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ai_summary" checked={formData.generate_ai_summary} onChange={e => setFormData({...formData, generate_ai_summary: e.target.checked})} />
            <label htmlFor="ai_summary" className="text-sm">Generate AI Summary</label>
          </div>
          
          <Button type="submit" disabled={loading} variant="primary" className="mt-4">
            {loading ? 'Saving...' : 'Record Yield'}
          </Button>
        </form>
      </div>
    </div>
  );
}
