import React, { useEffect, useMemo, useState } from 'react';
import { FiSave, FiUser, FiX } from 'react-icons/fi';
import API from '../../api/client';
import { EMPLOYEE_ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import ProfileCard from '../ProfileCard/ProfileCard';
import AttendanceCard from '../AttendanceCard/AttendanceCard';
import LeaveBalance from '../LeaveBalance/LeaveBalance';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
  });

  const [draftProfile, setDraftProfile] = useState(profile);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

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
          joinDate: employee?.joinDate || employee?.joiningDate || '',
          bio: DEFAULT_BIO,
          avatar: user?.avatar || '👨‍💼',
        };

        if (mounted) {
          setProfile(nextProfile);
          setDraftProfile(nextProfile);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Unable to load profile details right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.avatar, user?.department, user?.email, user?.name, user?.phone, user?.role]);

  const attendanceStats = useMemo(() => ({
    present: 20,
    absent: 2,
    late: 1,
    percentage: 91,
  }), []);

  const leaveStats = useMemo(() => ({
    totalLeaves: 24,
    usedLeaves: 8,
    sickLeaves: 8,
    casualLeaves: 16,
  }), []);

  const handleDraftChange = (field, value) => {
    setDraftProfile((previousProfile) => ({
      ...previousProfile,
      [field]: value,
    }));
  };

  const handleSaveChanges = () => {
    setProfile(draftProfile);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FiUser size={24} /> My Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">Personal details, attendance snapshot, and leave summary.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500 py-16">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading profile...
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            <ProfileCard
              name={profile.name}
              role={profile.designation || profile.role}
              department={profile.department}
              email={profile.email}
              phone={profile.phone}
              location={profile.location}
              avatar={profile.avatar}
              onEdit={() => setIsEditing(true)}
              className="h-full max-w-none"
            />

            <AttendanceCard
              present={attendanceStats.present}
              absent={attendanceStats.absent}
              late={attendanceStats.late}
              percentage={attendanceStats.percentage}
              className="h-full max-w-none"
            />

            <LeaveBalance
              totalLeaves={leaveStats.totalLeaves}
              usedLeaves={leaveStats.usedLeaves}
              sickLeaves={leaveStats.sickLeaves}
              casualLeaves={leaveStats.casualLeaves}
              className="h-full max-w-none"
            />
          </div>

          {isEditing && (
            <div className="mt-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-800">Edit Basic Details</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Cancel editing"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={draftProfile.name}
                    onChange={(event) => handleDraftChange('name', event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Designation</label>
                  <input
                    type="text"
                    value={draftProfile.designation}
                    onChange={(event) => handleDraftChange('designation', event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                  <input
                    type="text"
                    value={draftProfile.department}
                    onChange={(event) => handleDraftChange('department', event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={draftProfile.phone}
                    onChange={(event) => handleDraftChange('phone', event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                  <input
                    type="text"
                    value={draftProfile.location}
                    onChange={(event) => handleDraftChange('location', event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  <FiSave size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeProfile;
