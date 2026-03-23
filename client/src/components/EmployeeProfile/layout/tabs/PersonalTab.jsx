import React from 'react';

const PersonalTab = ({ profile }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">person</span>
        <h3 className="font-semibold text-lg text-slate-800">Personal Details</h3>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Full Name</span><span>{profile.fullName}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Email</span><span>{profile.email}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Phone</span><span>{profile.phone}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Address</span><span>{profile.address}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">City</span><span>{profile.city}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">State</span><span>{profile.state}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Country</span><span>{profile.country}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Pincode</span><span>{profile.pincode}</span></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons text-blue-500">contacts</span>
        <h3 className="font-semibold text-lg text-slate-800">Emergency Contact</h3>
      </div>
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex flex-col"><span className="text-xs text-slate-400">Name</span><span>{profile.emergencyContact?.name || '-'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Relation</span><span>{profile.emergencyContact?.relation || '-'}</span></div>
        <div className="flex flex-col"><span className="text-xs text-slate-400">Phone</span><span>{profile.emergencyContact?.phone || '-'}</span></div>
      </div>
    </div>
  </div>
);

export default PersonalTab;
