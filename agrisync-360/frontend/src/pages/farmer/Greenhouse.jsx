import React, { useState } from 'react';
import { greenhouseAPI } from '../../api/greenhouse';
import Button from '../../components/common/Button';

export default function Greenhouse() {
  const [formData, setFormData] = useState({ name: '', greenhouse_type: 'tunnel', current_crop: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');
    
    try {
      const res = await greenhouseAPI.createGreenhouse(formData);
      if (res.data?.success) {
        setSuccess('Greenhouse created successfully!');
        setFormData({ name: '', greenhouse_type: 'tunnel', current_crop: '' });
      }
    } catch (err) {
      setError(err.message || 'Failed to create greenhouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Greenhouse Management</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{success}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Greenhouse Name</label>
            <input type="text" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select className="w-full border p-2 rounded" value={formData.greenhouse_type} onChange={e => setFormData({...formData, greenhouse_type: e.target.value})}>
              <option value="tunnel">Tunnel</option>
              <option value="glass">Glass</option>
              <option value="shade_net">Shade Net</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Crop</label>
            <input type="text" className="w-full border p-2 rounded" value={formData.current_crop} onChange={e => setFormData({...formData, current_crop: e.target.value})} required />
          </div>
          
          <Button type="submit" disabled={loading} variant="primary" className="mt-4">
            {loading ? 'Saving...' : 'Add Greenhouse'}
          </Button>
        </form>
      </div>
    </div>
  );
}
