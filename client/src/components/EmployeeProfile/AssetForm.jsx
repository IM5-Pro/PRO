import React, { useState } from 'react';

const AssetForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { assetType: '', assetTag: '', description: '', assignedDate: '', status: 'Assigned' });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); onSave(form); };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="assetType" value={form.assetType} onChange={handleChange} placeholder="Asset Type" className="input-modern" required />
      <input name="assetTag" value={form.assetTag} onChange={handleChange} placeholder="Asset Tag" className="input-modern" />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="input-modern" />
      <input name="assignedDate" value={form.assignedDate} onChange={handleChange} placeholder="Assigned Date" className="input-modern" type="date" />
      <select name="status" value={form.status} onChange={handleChange} className="input-modern">
        <option value="Assigned">Assigned</option>
        <option value="Returned">Returned</option>
        <option value="Lost">Lost</option>
        <option value="Damaged">Damaged</option>
      </select>
      <div className="flex gap-2 mt-2">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
export default AssetForm;
