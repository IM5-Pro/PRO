import React from 'react';

const sectionTitle = 'font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-3';

const PersonalTab = ({ profile }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>Contact & address</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Full name</span><span className="text-slate-800">{profile.fullName || profile.name || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Email</span><span className="text-slate-800 break-all">{profile.email}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Phone</span><span className="text-slate-800">{profile.phone}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Date of birth</span><span className="text-slate-800">{profile.dob || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Gender</span><span className="text-slate-800">{profile.gender || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Blood group</span><span className="text-slate-800">{profile.bloodGroup || '—'}</span></div>
        <div className="flex flex-col gap-0.5 sm:col-span-2"><span className="text-xs text-slate-400">Address</span><span className="text-slate-800">{profile.address || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">City</span><span className="text-slate-800">{profile.city || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">State</span><span className="text-slate-800">{profile.state || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Country</span><span className="text-slate-800">{profile.country || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Postal code</span><span className="text-slate-800">{profile.zipCode || profile.pincode || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">PAN</span><span className="text-slate-800">{profile.panNumber || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Aadhaar</span><span className="text-slate-800">{profile.aadhaarNumber || '—'}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <h3 className={sectionTitle}>Emergency contact</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Name</span><span className="text-slate-800">{profile.emergencyContact?.name || '—'}</span></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-slate-400">Relation</span><span className="text-slate-800">{profile.emergencyContact?.relation || '—'}</span></div>
        <div className="flex flex-col gap-0.5 sm:col-span-2"><span className="text-xs text-slate-400">Phone</span><span className="text-slate-800">{profile.emergencyContact?.phone || '—'}</span></div>
      </div>
    </div>
  </div>
);

export default PersonalTab;
