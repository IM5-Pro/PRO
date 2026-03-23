import React, { useState } from 'react';

const ExperienceForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { companyName: '', jobTitle: '', from: '', to: '', skills: '' });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); onSave({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Company Name" className="input-modern" required />
      <input name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="Job Title" className="input-modern" required />
      <input name="from" value={form.from} onChange={handleChange} placeholder="From (YYYY-MM-DD)" className="input-modern" type="date" />
      <input name="to" value={form.to} onChange={handleChange} placeholder="To (YYYY-MM-DD)" className="input-modern" type="date" />
      <input name="skills" value={form.skills} onChange={handleChange} placeholder="Skills (comma separated)" className="input-modern" />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
export default ExperienceForm;
