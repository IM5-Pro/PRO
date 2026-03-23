import React, { useState } from 'react';

const SystemAccessForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { officialEmail: '', username: '', role: '', permissions: '' });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); onSave({ ...form, permissions: form.permissions.split(',').map(s => s.trim()).filter(Boolean) }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="officialEmail" value={form.officialEmail} onChange={handleChange} placeholder="Official Email" className="input-modern" />
      <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="input-modern" />
      <input name="role" value={form.role} onChange={handleChange} placeholder="Role" className="input-modern" />
      <input name="permissions" value={form.permissions} onChange={handleChange} placeholder="Permissions (comma separated)" className="input-modern" />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
export default SystemAccessForm;
