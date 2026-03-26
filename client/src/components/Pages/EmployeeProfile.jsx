
import React, { useEffect, useState } from 'react';
import API from '../../api/client';
import { EMPLOYEE_ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../EmployeeProfile/layout/TopHeader';
import ProfileSidebar from '../EmployeeProfile/layout/ProfileSidebar';
import TabbedContent from '../EmployeeProfile/layout/TabbedContent';
import OverviewTab from '../EmployeeProfile/layout/tabs/OverviewTab';
import PersonalTab from '../EmployeeProfile/layout/tabs/PersonalTab';
import JobTab from '../EmployeeProfile/layout/tabs/JobTab';
import PayrollTab from '../EmployeeProfile/layout/tabs/PayrollTab';
import DocumentsTab from '../EmployeeProfile/layout/tabs/DocumentsTab';
import PerformanceTab from '../EmployeeProfile/layout/tabs/PerformanceTab';

const formatRole = (value = '') => {
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase();
};

const getLocation = (employee) => {
  const location = [
    employee?.city || employee?.address?.city,
    employee?.state || employee?.address?.state,
  ]
    .filter(Boolean)
    .join(', ');

  return location || 'HQ Campus';
};

const DEFAULT_PHONE = '+1-234-567-8900';
const DEFAULT_EMAIL = 'employee@company.com';
const DEFAULT_BIO = 'Focused on delivering reliable outcomes and collaborating effectively with the team.';


const EmployeeProfile = () => {
  const { user = {} } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || 'Employee',
    role: formatRole(user?.role || 'EMPLOYEE'),
    designation: user?.designation || 'Employee',
    department: user?.department || 'General',
    email: user?.email || DEFAULT_EMAIL,
    phone: user?.phone || DEFAULT_PHONE,
    location: user?.location || 'HQ Campus',
    joinDate: '',
    bio: DEFAULT_BIO,
    avatar: user?.avatar || '👨‍💼',
    city: '',
    state: '',
    zipCode: '',
    address: '',
    emergencyContact: { name: '', relation: '', phone: '' },
  });
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const response = await API.get(EMPLOYEE_ENDPOINTS.myProfile);
        const employee = response?.data?.data || response?.data || {};
        const nextProfile = {
          name: [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || user?.name || 'Employee',
          role: formatRole(user?.role || 'EMPLOYEE'),
          designation: employee?.designation || 'Employee',
          department: employee?.department || user?.department || 'General',
          email: employee?.email || user?.email || DEFAULT_EMAIL,
          phone: employee?.phoneNumber || employee?.phone || user?.phone || DEFAULT_PHONE,
          location: getLocation(employee),
          bio: DEFAULT_BIO,
          avatar: user?.avatar || '👨‍💼',
          city: employee?.city || employee?.address?.city || '',
          state: employee?.state || employee?.address?.state || '',
          zipCode: employee?.zipCode || employee?.address?.zipCode || '',
          address: employee?.addressLine || employee?.address?.street || '',
          emergencyContact: employee?.emergencyContact || { name: '', relation: '', phone: '' },
        };
        if (mounted) {
          setProfile(nextProfile);
          setEditProfile(nextProfile);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.avatar, user?.department, user?.email, user?.name, user?.phone, user?.role]);

  // Live attendance and leave stats
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, percentage: 0 });
  const [leaveStats, setLeaveStats] = useState({ totalLeaves: 0, usedLeaves: 0, sickLeaves: 0, casualLeaves: 0 });

  useEffect(() => {
    // Fetch attendance summary
    const fetchAttendanceStats = async () => {
      try {
        const res = await API.get('/attendance/monthly-summary');
        const d = res.data?.data || {};
        setAttendanceStats({
          present: d.daysPresent ?? d.presentDays ?? 0,
          absent: d.daysAbsent ?? d.absentDays ?? 0,
          late: d.lateDays ?? d.late ?? 0,
          percentage: d.attendancePercentage ?? d.percentage ?? 0,
        });
      } catch {
        setAttendanceStats({ present: 0, absent: 0, late: 0, percentage: 0 });
      }
    };
    // Fetch leave stats
    const fetchLeaveStats = async () => {
      try {
        const res = await API.get('/leaves/balance');
        const d = res.data?.data || {};
        setLeaveStats({
          totalLeaves: d.totalLeaves ?? 0,
          usedLeaves: d.usedLeaves ?? 0,
          sickLeaves: d.sickLeaves ?? 0,
          casualLeaves: d.casualLeaves ?? 0,
        });
      } catch {
        setLeaveStats({ totalLeaves: 0, usedLeaves: 0, sickLeaves: 0, casualLeaves: 0 });
      }
    };
    fetchAttendanceStats();
    fetchLeaveStats();
  }, []);


  // Edit handlers
  const handleEdit = () => {
    setEditProfile(profile);
    setEditMode(true);
    setError('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditProfile(profile);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmergencyChange = (e) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [name]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        phoneNumber: editProfile.phone,
        address: editProfile.address,
        city: editProfile.city,
        state: editProfile.state,
        zipCode: editProfile.zipCode,
        emergencyContact: editProfile.emergencyContact,
      };
      await API.put(EMPLOYEE_ENDPOINTS.updateProfile, payload);
      setProfile((prev) => ({ ...prev, ...editProfile }));
      setEditMode(false);
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Tab state and config
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [
    { key: 'overview', label: 'Overview', icon: <span className="material-icons">dashboard</span> },
    { key: 'personal', label: 'Personal', icon: <span className="material-icons">person</span> },
    { key: 'job', label: 'Job', icon: <span className="material-icons">work</span> },
    { key: 'payroll', label: 'Payroll', icon: <span className="material-icons">payments</span> },
    { key: 'documents', label: 'Documents', icon: <span className="material-icons">description</span> },
    { key: 'performance', label: 'Performance', icon: <span className="material-icons">trending_up</span> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopHeader
        name={profile.name}
        role={profile.designation || profile.role}
        status={true ? 'active' : 'inactive'}
        onEdit={handleEdit}
        onDownload={() => {}}
        onMore={() => {}}
      />
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto gap-6 pt-6 px-2 md:px-6">
        <div className="md:w-1/4 w-full flex-shrink-0">
          <ProfileSidebar
            avatar={profile.avatar}
            name={profile.name}
            designation={profile.designation}
            department={profile.department}
            employeeId={user.employeeId || user._id}
            email={profile.email}
            phone={profile.phone}
            joinDate={profile.joinDate}
            experience={'2.1 Years'}
            location={profile.location}
            manager={profile.manager}
            onMessage={() => {}}
            onViewTeam={() => {}}
            onManagerClick={() => {}}
          />
        </div>
        <main className="flex-1 min-w-0">
          {editMode ? (
            <div className="bg-white rounded shadow p-6 max-w-xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500">Phone</label>
                  <input className="input input-bordered w-full" name="phone" value={editProfile.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Address</label>
                  <input className="input input-bordered w-full" name="address" value={editProfile.address} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">City</label>
                  <input className="input input-bordered w-full" name="city" value={editProfile.city} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">State</label>
                  <input className="input input-bordered w-full" name="state" value={editProfile.state} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Zip Code</label>
                  <input className="input input-bordered w-full" name="zipCode" value={editProfile.zipCode} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Emergency Contact Name</label>
                  <input className="input input-bordered w-full" name="name" value={editProfile.emergencyContact?.name || ''} onChange={handleEmergencyChange} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Emergency Contact Relation</label>
                  <input className="input input-bordered w-full" name="relation" value={editProfile.emergencyContact?.relation || ''} onChange={handleEmergencyChange} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Emergency Contact Phone</label>
                  <input className="input input-bordered w-full" name="phone" value={editProfile.emergencyContact?.phone || ''} onChange={handleEmergencyChange} />
                </div>
              </div>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              <div className="flex gap-2 mt-6">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>Cancel</button>
              </div>
            </div>
          ) : (
            <TabbedContent tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
              {/* Render tab content based on activeTab */}
              {activeTab === 'overview' && (
                <OverviewTab profile={profile} attendanceStats={attendanceStats} leaveStats={leaveStats} />
              )}
              {activeTab === 'personal' && (
                <PersonalTab profile={profile} />
              )}
              {activeTab === 'job' && (
                <JobTab profile={profile} experience={user.experience || []} />
              )}
              {activeTab === 'payroll' && (
                <PayrollTab payroll={user.payroll || { salary: '-', bankName: '-', accountNumber: '-', ifsc: '-', pan: '-', pfNumber: '-', esiNumber: '-', payslips: [] }} />
              )}
              {activeTab === 'documents' && (
                <DocumentsTab documents={user.documents || []} />
              )}
              {activeTab === 'performance' && (
                <PerformanceTab performance={user.performance || { rating: '-', lastReview: '-', goalsMet: '-', feedback: '-', timeline: [] }} />
              )}
            </TabbedContent>
          )}
        </main>
      </div>
    </div>
  );
};

export default EmployeeProfile;
