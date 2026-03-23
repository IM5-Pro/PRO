import React, { useState } from 'react';

const EducationForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { qualification: '', degree: '', university: '', yearOfPassing: '', certifications: '' });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); onSave({ ...form, certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean) }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="qualification" value={form.qualification} onChange={handleChange} placeholder="Qualification" className="input-modern" required />
      <input name="degree" value={form.degree} onChange={handleChange} placeholder="Degree" className="input-modern" />
      <input name="university" value={form.university} onChange={handleChange} placeholder="University" className="input-modern" />
      <input name="yearOfPassing" value={form.yearOfPassing} onChange={handleChange} placeholder="Year of Passing" className="input-modern" type="number" />
      <input name="certifications" value={form.certifications} onChange={handleChange} placeholder="Certifications (comma separated)" className="input-modern" />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
export default EducationForm;
