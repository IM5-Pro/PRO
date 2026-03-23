import React, { useState } from 'react';

const PerformanceForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { kpis: '', goals: '', ratings: '', appraisalHistory: '', managerFeedback: '' });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault();
    onSave({
      ...form,
      kpis: form.kpis.split(',').map(s => s.trim()).filter(Boolean),
      goals: form.goals.split(',').map(s => s.trim()).filter(Boolean),
      ratings: [], // Advanced: parse ratings JSON
      appraisalHistory: [], // Advanced: parse appraisals JSON
      managerFeedback: [] // Advanced: parse feedback JSON
    });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="kpis" value={form.kpis} onChange={handleChange} placeholder="KPIs (comma separated)" className="input-modern" />
      <input name="goals" value={form.goals} onChange={handleChange} placeholder="Goals (comma separated)" className="input-modern" />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
export default PerformanceForm;
