import React, { useState } from 'react';
import { farmOpsAPI } from '../../api/farmOps';
import Button from '../../components/common/Button';

export default function FarmOperations() {
  const [formData, setFormData] = useState({ operation_type: '', operation_date: '', crop_name: '', cost_ksh: '' });
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
        cost_ksh: parseFloat(formData.cost_ksh)
      };
      const res = await farmOpsAPI.createFarmOp(payload);
      if (res.data?.success) {
        setSuccess('Operation logged successfully!');
        setFormData({ operation_type: '', operation_date: '', crop_name: '', cost_ksh: '' });
      }
    } catch (err) {
      setError(err.message || 'Failed to log operation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Farm Operations</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{success}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation Type</label>
            <input type="text" className="w-full border p-2 rounded" value={formData.operation_type} onChange={e => setFormData({...formData, operation_type: e.target.value})} placeholder="e.g., Planting, Weeding, Fertilizing" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" className="w-full border p-2 rounded" value={formData.operation_date} onChange={e => setFormData({...formData, operation_date: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Crop Name</label>
            <input type="text" className="w-full border p-2 rounded" value={formData.crop_name} onChange={e => setFormData({...formData, crop_name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cost (KSH)</label>
            <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.cost_ksh} onChange={e => setFormData({...formData, cost_ksh: e.target.value})} required />
          </div>
          
          <Button type="submit" disabled={loading} variant="primary" className="mt-4">
            {loading ? 'Saving...' : 'Log Operation'}
          </Button>
        </form>
      </div>
    </div>
  );
}
