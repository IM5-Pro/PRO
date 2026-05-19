import React, { useState } from 'react';

const PayrollForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { ctc: '', basic: '', hra: '', bankName: '', bankAccountNumber: '', ifscCode: '', pfNumber: '', uan: '', esiDetails: '', taxInfo: '' });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); onSave(form); };
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="ctc" value={form.ctc} onChange={handleChange} placeholder="CTC (₹ per annum)" className="input-modern" />
      <input name="basic" value={form.basic} onChange={handleChange} placeholder="Basic (₹)" className="input-modern" />
      <input name="hra" value={form.hra} onChange={handleChange} placeholder="HRA (₹)" className="input-modern" />
      <input name="bankName" value={form.bankName} onChange={handleChange} placeholder="Bank Name" className="input-modern" />
      <input name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} placeholder="Bank Account Number" className="input-modern" />
      <input name="ifscCode" value={form.ifscCode} onChange={handleChange} placeholder="IFSC Code" className="input-modern" />
      <input name="pfNumber" value={form.pfNumber} onChange={handleChange} placeholder="PF Number" className="input-modern" />
      <input name="uan" value={form.uan} onChange={handleChange} placeholder="UAN" className="input-modern" />
      <input name="esiDetails" value={form.esiDetails} onChange={handleChange} placeholder="ESI Details" className="input-modern" />
      <input name="taxInfo" value={form.taxInfo} onChange={handleChange} placeholder="Tax Info" className="input-modern" />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
export default PayrollForm;
