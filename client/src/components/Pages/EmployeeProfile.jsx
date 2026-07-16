
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import API from '../../api/client';
import {
  ATTENDANCE_ENDPOINTS,
  EMPLOYEE_ENDPOINTS,
  EXPERIENCE_ENDPOINTS,
  LEAVE_ENDPOINTS,
  PAYROLL_ENDPOINTS,
} from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import {
  FiBriefcase,
  FiFolder,
  FiLayout,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import TopHeader from '../EmployeeProfile/layout/TopHeader';
import ProfileSidebar from '../EmployeeProfile/layout/ProfileSidebar';
import TabbedContent from '../EmployeeProfile/layout/TabbedContent';
import OverviewTab from '../EmployeeProfile/layout/tabs/OverviewTab';
import PersonalTab from '../EmployeeProfile/layout/tabs/PersonalTab';
import JobTab from '../EmployeeProfile/layout/tabs/JobTab';
import PayrollTab from '../EmployeeProfile/layout/tabs/PayrollTab';
import DocumentsTab from '../EmployeeProfile/layout/tabs/DocumentsTab';
import PerformanceTab from '../EmployeeProfile/layout/tabs/PerformanceTab';
import { formatINR } from '../../utils/currency';
import {
  formatPayrollMonthLabel,
  pickPayrollDetailForDisplay,
  filterPayrollDetailsByEmploymentStart,
  sortPayrollDetailsByPeriodDesc,
} from '../../utils/payrollPeriod';
import RupeeIcon from '../icons/RupeeIcon';
import {
  mergeProfileWithPending,
  submitProfileForApproval,
} from '../../services/profileChangeApi';

const formatRole = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .toLowerCase();

const profileFieldLabel = 'block text-xs font-medium text-slate-500 mb-1.5';
const profileFieldInput =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const profileFieldInputReadOnly =
  'h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 cursor-default';
const profileSectionHeading = 'text-base font-semibold text-slate-800 border-b border-slate-100 pb-2';

const getLocation = (employee) => {
  const location = [
    employee?.city || employee?.address?.city,
    employee?.state || employee?.address?.state,
  ]
    .filter(Boolean)
    .join(', ');

  return location || '—';
};

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatEmploymentType = (value) => {
  if (!value) return '—';
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const unwrapPayloadData = (response) => {
  const body = response?.data;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data;
  }
  return body ?? {};
};

const DEFAULT_PHONE = '+1-234-567-8900';
const DEFAULT_EMAIL = 'employee@company.com';
const DEFAULT_BIO =
  'Focused on delivering reliable outcomes and collaborating effectively with the team.';

const EmployeeProfile = () => {
  const { user = {} } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || 'Employee',
    fullName: user?.name || 'Employee',
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
    country: '',
    address: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: { name: '', relation: '', phone: '' },
    employeeCode: '',
    employeeMongoId: '',
    status: '',
    manager: '',
    panNumber: '',
    aadhaarNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirthInput: '',
    employmentType: '',
    salary: '',
    lastLogin: '',
    lastUpdate: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [experienceRows, setExperienceRows] = useState([]);
  const [payrollView, setPayrollView] = useState({
    salary: '—',
    bankName: '—',
    accountNumber: '—',
    ifsc: '—',
    pan: '—',
    pfNumber: '—',
    esiNumber: '—',
    payslips: [],
  });
  const [documentsList, setDocumentsList] = useState([]);
  const [pendingProfileChange, setPendingProfileChange] = useState(null);
  const [profileCompletionStatus, setProfileCompletionStatus] = useState('complete');
  const [saveNotice, setSaveNotice] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, managerRes] = await Promise.all([
        API.get(EMPLOYEE_ENDPOINTS.myProfile),
        API.get(EMPLOYEE_ENDPOINTS.myManager).catch(() => ({ data: {} })),
      ]);

      const profileBody = profileRes?.data || {};
      const employee = unwrapPayloadData(profileRes) || profileBody.data;
      setPendingProfileChange(profileBody.pendingProfileChange || null);
      setProfileCompletionStatus(profileBody.profileCompletionStatus || 'complete');
      const managerPayload = unwrapPayloadData(managerRes);
      const managerName = managerPayload
        ? [managerPayload.firstName, managerPayload.lastName].filter(Boolean).join(' ').trim()
        : '';

      const joinRaw = employee?.joinDate || employee?.joiningDate;
      const fullName = [employee?.firstName, employee?.middleName, employee?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      const nextProfile = {
        name: fullName || user?.name || 'Employee',
        fullName: fullName || user?.name || 'Employee',
        role: formatRole(user?.role || 'EMPLOYEE'),
        designation: employee?.designation || 'Employee',
        department: employee?.department || user?.department || 'General',
        email: employee?.email || user?.email || DEFAULT_EMAIL,
        phone: employee?.phoneNumber || employee?.phone || user?.phone || DEFAULT_PHONE,
        location: getLocation(employee),
        joinDate: formatDate(joinRaw) || '—',
        bio: DEFAULT_BIO,
        avatar: user?.avatar || '👨‍💼',
        city: employee?.city || employee?.address?.city || '',
        state: employee?.state || employee?.address?.state || '',
        zipCode: employee?.zipCode || employee?.address?.zipCode || '',
        country: employee?.address?.country || employee?.country || '',
        address: employee?.addressLine || employee?.address?.street || '',
        dob: formatDate(employee?.dateOfBirth),
        gender: employee?.gender || '',
        bloodGroup: employee?.bloodGroup || '',
        emergencyContact: employee?.emergencyContact || { name: '', relation: '', phone: '' },
        employeeCode: employee?.employeeCode || '—',
        employeeMongoId: String(employee?._id || user?.employeeId || ''),
        status: employee?.status || '—',
        manager: managerName || '—',
        panNumber: employee?.panNumber ?? '',
        aadhaarNumber: employee?.aadhaarNumber ?? '',
        firstName: employee?.firstName || '',
        middleName: employee?.middleName || '',
        lastName: employee?.lastName || '',
        dateOfBirthInput: toDateInputValue(employee?.dateOfBirth),
        employmentType: employee?.employmentType || '',
        salary: employee?.salary != null ? formatINR(employee.salary) : '—',
        lastLogin: user?.lastLogin ? formatDate(user.lastLogin) : '—',
        lastUpdate: formatDate(employee?.updatedAt) || '—',
      };

      setProfile(nextProfile);
      setEditProfile(nextProfile);

      const empId = employee?._id || user?.employeeId;
      if (empId) {
        try {
          const expRes = await API.get(EXPERIENCE_ENDPOINTS.list(empId));
          const expData = unwrapPayloadData(expRes);
          const list = Array.isArray(expData) ? expData : [];
          setExperienceRows(
            list.map((row) => ({
              role: row.jobTitle || row.role || '—',
              company: row.companyName || row.company || '—',
              from: formatDate(row.from),
              to: row.to ? formatDate(row.to) : 'Present',
            })),
          );
        } catch {
          setExperienceRows([]);
        }
      } else {
        setExperienceRows([]);
      }

      const docs = Array.isArray(employee?.documents) ? employee.documents : [];
      setDocumentsList(
        docs.map((doc) => ({
          name: doc.documentType || doc.fileName || 'Document',
          url: doc.fileUrl || '#',
        })),
      );
    } catch (err) {
      console.error('Profile load failed', err);
    }
  }, [user?.avatar, user?.department, user?.email, user?.employeeId, user?.lastLogin, user?.name, user?.phone, user?.role]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  });
  const [leaveStats, setLeaveStats] = useState({
    totalLeaves: 0,
    usedLeaves: 0,
    sickLeaves: 0,
    casualLeaves: 0,
  });

  const employeeIdForApis = useMemo(() => user?.employeeId, [user?.employeeId]);

  useEffect(() => {
    const fetchAttendanceStats = async () => {
      try {
        const res = await API.get(ATTENDANCE_ENDPOINTS.monthlySummary);
        const body = res?.data || {};
        const summary = body.summary || {};
        const total = summary.totalRecords || 0;
        const present = summary.presentCount ?? 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        setAttendanceStats({
          present,
          absent: summary.absentCount ?? 0,
          late: summary.lateCount ?? 0,
          percentage: pct,
        });
      } catch {
        setAttendanceStats({ present: 0, absent: 0, late: 0, percentage: 0 });
      }
    };

    const fetchLeaveStats = async () => {
      try {
        const url = employeeIdForApis
          ? LEAVE_ENDPOINTS.balance(employeeIdForApis)
          : LEAVE_ENDPOINTS.balance();
        const res = await API.get(url);
        const balances = unwrapPayloadData(res);
        const rows = Array.isArray(balances) ? balances : [];
        let remaining = 0;
        let used = 0;
        rows.forEach((b) => {
          remaining += Number(b.remainingDays) || 0;
          used += Number(b.usedDays) || 0;
        });
        setLeaveStats({
          totalLeaves: remaining + used,
          usedLeaves: used,
          sickLeaves: 0,
          casualLeaves: 0,
        });
      } catch {
        setLeaveStats({ totalLeaves: 0, usedLeaves: 0, sickLeaves: 0, casualLeaves: 0 });
      }
    };

    const fetchPayroll = async () => {
      try {
        const [payrollRes, profileRes] = await Promise.all([
          API.get(PAYROLL_ENDPOINTS.own),
          API.get(EMPLOYEE_ENDPOINTS.myProfile).catch(() => null),
        ]);
        const body = payrollRes?.data || {};
        const details = Array.isArray(body.details) ? body.details : [];
        const employee = profileRes?.data?.data || null;
        const eligible = filterPayrollDetailsByEmploymentStart(details, employee);
        const sorted = sortPayrollDetailsByPeriodDesc(eligible);
        const { detail: compensation, isProjected } = pickPayrollDetailForDisplay(
          sorted,
          employee,
        );

        const payslips = sorted.slice(0, 12).map((d) => {
          const run = d.payrollRunId;
          return {
            id: d._id,
            month: formatPayrollMonthLabel(d) || formatDate(d.createdAt) || 'Period',
            year: run?.year || '',
          };
        });

        setPayrollView({
          salary:
            compensation?.netSalary != null ? formatINR(compensation.netSalary) : '—',
          grossSalary:
            compensation?.grossSalary != null ? formatINR(compensation.grossSalary) : '—',
          deductionsTotal:
            compensation?.totalDeductions != null
              ? formatINR(compensation.totalDeductions)
              : '—',
          isProjected,
          bankName: '—',
          accountNumber: '—',
          ifsc: '—',
          pan: '—',
          pfNumber: compensation?.pf != null ? formatINR(compensation.pf) : '—',
          esiNumber: compensation?.esi != null ? formatINR(compensation.esi) : '—',
          payslips,
        });
      } catch {
        setPayrollView({
          salary: '—',
          grossSalary: '—',
          deductionsTotal: '—',
          isProjected: false,
          bankName: '—',
          accountNumber: '—',
          ifsc: '—',
          pan: '—',
          pfNumber: '—',
          esiNumber: '—',
          payslips: [],
        });
      }
    };

    fetchAttendanceStats();
    fetchLeaveStats();
    fetchPayroll();
  }, [employeeIdForApis]);

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

  const buildProfilePayload = () => ({
    firstName: editProfile.firstName,
    middleName: editProfile.middleName,
    lastName: editProfile.lastName,
    phoneNumber: editProfile.phone,
    dateOfBirth: editProfile.dateOfBirthInput || '',
    panNumber: editProfile.panNumber,
    aadhaarNumber: editProfile.aadhaarNumber,
    gender: editProfile.gender,
    bloodGroup: editProfile.bloodGroup,
    address: editProfile.address,
    city: editProfile.city,
    state: editProfile.state,
    zipCode: editProfile.zipCode,
    country: editProfile.country,
    emergencyContact: editProfile.emergencyContact,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    setSaveNotice('');
    try {
      await submitProfileForApproval(buildProfilePayload(), { submitForApproval: false });
      setSaveNotice('Draft saved. Submit for HR approval when you are ready.');
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSaving(true);
    setError('');
    setSaveNotice('');
    try {
      await submitProfileForApproval(buildProfilePayload(), { submitForApproval: true });
      setEditMode(false);
      setSaveNotice('Submitted for HR approval. Changes will show after HR reviews them.');
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit profile.');
    } finally {
      setSaving(false);
    }
  };

  const [activeTab, setActiveTab] = useState('overview');
  const tabs = useMemo(
    () => [
      {
        key: 'overview',
        label: 'Profile overview',
        icon: <FiLayout className="h-4 w-4" aria-hidden />,
      },
      {
        key: 'personal',
        label: 'Personal & contact',
        icon: <FiUser className="h-4 w-4" aria-hidden />,
      },
      {
        key: 'job',
        label: 'Job & employment',
        icon: <FiBriefcase className="h-4 w-4" aria-hidden />,
      },
      {
        key: 'payroll',
        label: 'Payroll & payslips',
        icon: <RupeeIcon className="h-4 w-4" aria-hidden />,
      },
      {
        key: 'documents',
        label: 'Documents',
        icon: <FiFolder className="h-4 w-4" aria-hidden />,
      },
      {
        key: 'performance',
        label: 'Performance',
        icon: <FiTrendingUp className="h-4 w-4" aria-hidden />,
      },
    ],
    [],
  );

  const sidebarEmployeeId = user?.employeeId || profile.employeeMongoId || '—';
  const { display: displayProfile, hasPending } = mergeProfileWithPending(profile, pendingProfileChange);
  const pendingReview =
    hasPending || pendingProfileChange?.status === 'PENDING' || profileCompletionStatus === 'pending_hr';
  const needsOnboarding =
    profileCompletionStatus === 'pending_employee' && pendingProfileChange?.status !== 'PENDING';

  return (
    <div className="min-h-screen bg-im5-page">
      <TopHeader
        name={profile.name}
        role={profile.designation || profile.role}
        status={String(profile.status || '').toUpperCase() === 'ACTIVE' ? 'active' : 'inactive'}
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
            employeeId={sidebarEmployeeId}
            email={profile.email}
            phone={profile.phone}
            joinDate={profile.joinDate}
            experience="—"
            location={profile.location}
            manager={profile.manager !== '—' ? profile.manager : ''}
            onManagerClick={() => {}}
          />
        </div>
        <main className="flex-1 min-w-0">
          {pendingReview && !editMode ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>Under HR review.</strong> Your submitted profile changes are pending HR approval.
            </div>
          ) : null}
          {needsOnboarding && !editMode ? (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <strong>Complete your profile.</strong> Fill remaining details and submit for HR approval.
            </div>
          ) : null}
          {saveNotice && !editMode ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {saveNotice}
            </div>
          ) : null}
          {editMode ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8 w-full max-w-4xl mx-auto space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit profile</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Save a draft or submit for HR approval. Approved changes appear on your employee record.
                </p>
              </div>

              <section className="space-y-4">
                <h3 className={profileSectionHeading}>
                  Work details (read-only)
                </h3>
                <p className="text-xs text-slate-500 -mt-2">
                  These fields are maintained by HR. Contact HR if something needs to be corrected.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  {[
                    ['Work email', editProfile.email],
                    ['Employee code', editProfile.employeeCode],
                    ['Designation', editProfile.designation],
                    ['Department', editProfile.department],
                    ['Manager', editProfile.manager],
                    ['Join date', editProfile.joinDate],
                    ['Status', editProfile.status],
                    ['Employment type', formatEmploymentType(editProfile.employmentType)],
                    ['Salary on record', editProfile.salary],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className={profileFieldLabel}>{label}</span>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        className={profileFieldInputReadOnly}
                        value={val ?? ''}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={profileSectionHeading}>Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-firstName">
                      First name
                    </label>
                    <input
                      id="ep-firstName"
                      className={profileFieldInput}
                      name="firstName"
                      value={editProfile.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-middleName">
                      Middle name
                    </label>
                    <input
                      id="ep-middleName"
                      className={profileFieldInput}
                      name="middleName"
                      value={editProfile.middleName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-lastName">
                      Last name
                    </label>
                    <input
                      id="ep-lastName"
                      className={profileFieldInput}
                      name="lastName"
                      value={editProfile.lastName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-dob">
                      Date of birth
                    </label>
                    <input
                      id="ep-dob"
                      type="date"
                      className={profileFieldInput}
                      name="dateOfBirthInput"
                      value={editProfile.dateOfBirthInput}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-gender">
                      Gender
                    </label>
                    <input
                      id="ep-gender"
                      className={profileFieldInput}
                      name="gender"
                      value={editProfile.gender}
                      onChange={handleChange}
                      list="ep-gender-options"
                      placeholder="Type or pick a suggestion"
                    />
                    <datalist id="ep-gender-options">
                      <option value="Male" />
                      <option value="Female" />
                      <option value="Other" />
                      <option value="Prefer not to say" />
                    </datalist>
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-blood">
                      Blood group
                    </label>
                    <input
                      id="ep-blood"
                      className={profileFieldInput}
                      name="bloodGroup"
                      value={editProfile.bloodGroup}
                      onChange={handleChange}
                      list="ep-blood-options"
                      placeholder="e.g. O+"
                    />
                    <datalist id="ep-blood-options">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                        <option key={bg} value={bg} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={profileSectionHeading}>
                  Contact & address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="sm:col-span-2">
                    <label className={profileFieldLabel} htmlFor="ep-phone">
                      Phone
                    </label>
                    <input
                      id="ep-phone"
                      className={profileFieldInput}
                      name="phone"
                      value={editProfile.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={profileFieldLabel} htmlFor="ep-address">
                      Street / address line
                    </label>
                    <input
                      id="ep-address"
                      className={profileFieldInput}
                      name="address"
                      value={editProfile.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-city">
                      City
                    </label>
                    <input
                      id="ep-city"
                      className={profileFieldInput}
                      name="city"
                      value={editProfile.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-state">
                      State / region
                    </label>
                    <input
                      id="ep-state"
                      className={profileFieldInput}
                      name="state"
                      value={editProfile.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-country">
                      Country
                    </label>
                    <input
                      id="ep-country"
                      className={profileFieldInput}
                      name="country"
                      value={editProfile.country}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-zip">
                      Postal code
                    </label>
                    <input
                      id="ep-zip"
                      className={profileFieldInput}
                      name="zipCode"
                      value={editProfile.zipCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={profileSectionHeading}>
                  Government IDs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-pan">
                      PAN
                    </label>
                    <input
                      id="ep-pan"
                      className={`${profileFieldInput} uppercase`}
                      name="panNumber"
                      value={editProfile.panNumber}
                      onChange={handleChange}
                      autoCapitalize="characters"
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-aadhaar">
                      Aadhaar
                    </label>
                    <input
                      id="ep-aadhaar"
                      className={profileFieldInput}
                      name="aadhaarNumber"
                      value={editProfile.aadhaarNumber}
                      onChange={handleChange}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={profileSectionHeading}>
                  Emergency contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-ec-name">
                      Name
                    </label>
                    <input
                      id="ep-ec-name"
                      className={profileFieldInput}
                      name="name"
                      value={editProfile.emergencyContact?.name || ''}
                      onChange={handleEmergencyChange}
                    />
                  </div>
                  <div>
                    <label className={profileFieldLabel} htmlFor="ep-ec-relation">
                      Relation
                    </label>
                    <input
                      id="ep-ec-relation"
                      className={profileFieldInput}
                      name="relation"
                      value={editProfile.emergencyContact?.relation || ''}
                      onChange={handleEmergencyChange}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={profileFieldLabel} htmlFor="ep-ec-phone">
                      Phone
                    </label>
                    <input
                      id="ep-ec-phone"
                      className={profileFieldInput}
                      name="phone"
                      value={editProfile.emergencyContact?.phone || ''}
                      onChange={handleEmergencyChange}
                    />
                  </div>
                </div>
              </section>

              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
                  {error}
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmitForApproval}
                  disabled={saving || pendingProfileChange?.status === 'PENDING'}
                >
                  {saving ? 'Submitting…' : 'Submit for HR approval'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? 'Saving…' : 'Save draft'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <TabbedContent tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
              {activeTab === 'overview' && (
                <OverviewTab profile={displayProfile} attendanceStats={attendanceStats} leaveStats={leaveStats} />
              )}
              {activeTab === 'personal' && <PersonalTab profile={displayProfile} />}
              {activeTab === 'job' && <JobTab profile={displayProfile} experience={experienceRows} />}
              {activeTab === 'payroll' && <PayrollTab payroll={payrollView} />}
              {activeTab === 'documents' && <DocumentsTab documents={documentsList} />}
              {activeTab === 'performance' && (
                <PerformanceTab
                  performance={{
                    rating: '—',
                    lastReview: '—',
                    goalsMet: '—',
                    feedback: '—',
                    timeline: [],
                  }}
                />
              )}
            </TabbedContent>
          )}
        </main>
      </div>
    </div>
  );
};

export default EmployeeProfile;
