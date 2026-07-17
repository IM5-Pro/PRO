import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiMessageSquare, FiEdit2, FiFilter, FiPlus, FiSend, FiTrash2, FiX } from 'react-icons/fi';
import API from '../../api/client';
import { ANNOUNCEMENT_ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { normalizeRole, ROLES } from '../../utils/roles';

const rolePermissions = {
  [ROLES.SUPER_ADMIN]: {
    create: true,
    edit: true,
    delete: true,
    audiences: ['ALL', 'DEPARTMENT', 'ROLE', 'LOCATION', 'TEAM'],
  },
  [ROLES.HR_ADMIN]: {
    create: true,
    edit: true,
    delete: false,
    audiences: ['ALL', 'DEPARTMENT'],
  },
  [ROLES.MANAGER]: {
    create: true,
    edit: false,
    delete: false,
    audiences: ['TEAM'],
  },
  [ROLES.EMPLOYEE]: {
    create: false,
    edit: false,
    delete: false,
    audiences: [],
  },
};

const audienceLabels = {
  ALL: 'All Employees',
  DEPARTMENT: 'Department',
  ROLE: 'Role',
  LOCATION: 'Location',
  TEAM: 'Team',
};

const deliveryLabel = {
  notification: 'Notification',
  email: 'Email',
  dashboardBanner: 'Dashboard Banner',
};

const defaultForm = {
  title: '',
  content: '',
  priority: 'MEDIUM',
  audienceType: 'ALL',
  department: '',
  targetRole: '',
  location: '',
  teamManagerEmployeeId: '',
  deliveryChannels: {
    notification: true,
    email: false,
    dashboardBanner: true,
  },
};

const normalizeAnnouncement = (item) => {
  const id = item?._id || item?.id;
  const priority = String(item?.priority || 'MEDIUM').toUpperCase();
  return {
    ...item,
    id,
    priority,
    audienceType: String(item?.audienceType || 'ALL').toUpperCase(),
    deliveryChannels: {
      notification: item?.deliveryChannels?.notification !== false,
      email: item?.deliveryChannels?.email === true,
      dashboardBanner: item?.deliveryChannels?.dashboardBanner !== false,
    },
  };
};

const toPayloadRows = (response) => {
  const payload = response?.data || {};
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
};

const Announcements = () => {
  const { colors } = useTheme();
  const { user = {} } = useAuth();

  const role = normalizeRole(user?.role);
  const permission = rolePermissions[role] || rolePermissions[ROLES.EMPLOYEE];

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formValues, setFormValues] = useState(() => {
    if (permission.audiences.length === 1) {
      return {
        ...defaultForm,
        audienceType: permission.audiences[0],
      };
    }

    return defaultForm;
  });

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await API.get(ANNOUNCEMENT_ENDPOINTS.list);
      const rows = toPayloadRows(response).map(normalizeAnnouncement);
      setAnnouncements(rows);
    } catch (err) {
      setAnnouncements([]);
      setError(err?.response?.data?.message || err?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const filteredAnnouncements = useMemo(() => {
    if (filter === 'all') {
      return announcements;
    }

    return announcements.filter((item) => String(item.priority || '').toLowerCase() === filter);
  }, [announcements, filter]);

  const bannerAnnouncements = useMemo(() => {
    return filteredAnnouncements.filter((item) => item.deliveryChannels?.dashboardBanner);
  }, [filteredAnnouncements]);

  const getPriorityColor = (priority) => {
    const normalized = String(priority || '').toLowerCase();
    if (normalized === 'high') return 'from-red-500 to-pink-500';
    if (normalized === 'medium') return 'from-yellow-500 to-orange-500';
    if (normalized === 'low') return 'from-green-500 to-emerald-500';
    return 'from-blue-500 to-cyan-500';
  };

  const resetComposer = useCallback(() => {
    setEditingId('');
    setFormValues({
      ...defaultForm,
      audienceType: permission.audiences.length === 1 ? permission.audiences[0] : 'ALL',
    });
    setShowComposer(false);
  }, [permission.audiences]);

  const toRequestPayload = () => {
    const payload = {
      title: formValues.title.trim(),
      content: formValues.content.trim(),
      priority: formValues.priority,
      audienceType: formValues.audienceType,
      deliveryChannels: formValues.deliveryChannels,
    };

    if (formValues.audienceType === 'DEPARTMENT') {
      payload.department = formValues.department.trim();
    }

    if (formValues.audienceType === 'ROLE') {
      payload.role = formValues.targetRole.trim().toUpperCase();
    }

    if (formValues.audienceType === 'LOCATION') {
      payload.location = formValues.location.trim();
    }

    if (formValues.audienceType === 'TEAM' && formValues.teamManagerEmployeeId.trim()) {
      payload.teamManagerEmployeeId = formValues.teamManagerEmployeeId.trim();
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formValues.title.trim() || !formValues.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = toRequestPayload();
      if (editingId) {
        await API.put(ANNOUNCEMENT_ENDPOINTS.update(editingId), payload);
      } else {
        await API.post(ANNOUNCEMENT_ENDPOINTS.create, payload);
      }

      resetComposer();
      await loadAnnouncements();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async (announcementId) => {
    try {
      await API.post(ANNOUNCEMENT_ENDPOINTS.dismiss(announcementId));
      setAnnouncements((prev) => prev.filter((item) => item.id !== announcementId));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to dismiss announcement');
    }
  };

  const handleDelete = async (announcementId) => {
    try {
      await API.delete(ANNOUNCEMENT_ENDPOINTS.delete(announcementId));
      setAnnouncements((prev) => prev.filter((item) => item.id !== announcementId));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete announcement');
    }
  };

  const startEdit = (item) => {
    if (!permission.edit) {
      return;
    }

    setEditingId(item.id);
    setShowComposer(true);
    setFormValues({
      title: item.title || '',
      content: item.content || '',
      priority: item.priority || 'MEDIUM',
      audienceType: item.audienceType || 'ALL',
      department: item?.audience?.department || '',
      targetRole: item?.audience?.role || '',
      location: item?.audience?.location || '',
      teamManagerEmployeeId: item?.audience?.teamManagerEmployeeId || '',
      deliveryChannels: {
        notification: item?.deliveryChannels?.notification !== false,
        email: item?.deliveryChannels?.email === true,
        dashboardBanner: item?.deliveryChannels?.dashboardBanner !== false,
      },
    });
  };

  const canCreate = permission.create;

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];

  const getFilterButtonClass = (key, active) => {
    const base = 'rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors focus:outline-none';

    if (!active) {
      return `${base} border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300`;
    }

    const activeStyles = {
      all: 'bg-slate-800 text-white border-slate-800 shadow-sm',
      high: 'bg-red-50 text-red-700 border-red-200 shadow-sm',
      medium: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
    };

    return `${base} ${activeStyles[key] || activeStyles.all}`;
  };

  return (
    <div className="min-h-screen bg-im5-page p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} flex items-center gap-3`}>
            <FiMessageSquare className="w-10 h-10" /> Announcements
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm">
            <FiFilter className="text-slate-400 shrink-0" size={16} aria-hidden />
            <div className="flex flex-wrap items-center gap-1.5">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilter(option.key)}
                  className={getFilterButtonClass(option.key, filter === option.key)}
                  aria-pressed={filter === option.key}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setShowComposer((prev) => !prev);
                if (showComposer) {
                  resetComposer();
                }
              }}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2"
            >
              <FiPlus /> {showComposer ? 'Close' : 'Create & Send Announcement'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {bannerAnnouncements.length > 0 && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-700 mb-2">Dashboard Banner</p>
          <p className="text-slate-800 text-sm">
            {bannerAnnouncements[0].title}: {bannerAnnouncements[0].content}
          </p>
        </div>
      )}

      {canCreate && showComposer && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={formValues.title}
                onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formValues.priority}
                onChange={(event) => setFormValues((prev) => ({ ...prev, priority: event.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <textarea
              rows={4}
              value={formValues.content}
              onChange={(event) => setFormValues((prev) => ({ ...prev, content: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Write announcement content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
              <select
                value={formValues.audienceType}
                disabled={permission.audiences.length === 1}
                onChange={(event) => setFormValues((prev) => ({ ...prev, audienceType: event.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
              >
                {permission.audiences.map((audienceKey) => (
                  <option key={audienceKey} value={audienceKey}>{audienceLabels[audienceKey]}</option>
                ))}
              </select>
            </div>

            {formValues.audienceType === 'DEPARTMENT' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input
                  value={formValues.department}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, department: event.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Engineering"
                />
              </div>
            )}

            {formValues.audienceType === 'ROLE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <input
                  value={formValues.targetRole}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, targetRole: event.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. EMPLOYEE"
                />
              </div>
            )}

            {formValues.audienceType === 'LOCATION' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  value={formValues.location}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, location: event.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Bangalore"
                />
              </div>
            )}

            {formValues.audienceType === 'TEAM' && role === ROLES.SUPER_ADMIN && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Manager Employee ID</label>
                <input
                  value={formValues.teamManagerEmployeeId}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, teamManagerEmployeeId: event.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Target manager employee id"
                />
              </div>
            )}
          </div>

          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-2">Delivery</p>
            <div className="flex flex-wrap gap-4">
              {Object.keys(formValues.deliveryChannels).map((key) => (
                <label key={key} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formValues.deliveryChannels[key])}
                    onChange={(event) => setFormValues((prev) => ({
                      ...prev,
                      deliveryChannels: {
                        ...prev.deliveryChannels,
                        [key]: event.target.checked,
                      },
                    }))}
                  />
                  {deliveryLabel[key]}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetComposer}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <FiSend size={16} /> {submitting ? 'Sending...' : editingId ? 'Update Announcement' : 'Send Announcement'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading announcements...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">No announcements available.</div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="group bg-white rounded-2xl border border-slate-200 p-6" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className={`text-xl font-bold ${colors.text.primary}`}>{announcement.title}</h3>
                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${getPriorityColor(announcement.priority)} text-white text-xs font-semibold`}>
                      {String(announcement.priority || 'MEDIUM').toLowerCase()}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                      {audienceLabels[announcement.audienceType] || announcement.audienceType}
                    </span>
                  </div>

                  <p className={`${colors.text.secondary} mb-3`}>{announcement.content}</p>

                  <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{announcement.createdByName || 'System'}</span>
                    <span>•</span>
                    <span>{new Date(announcement.publishedAt || announcement.createdAt || Date.now()).toLocaleString()}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(announcement.deliveryChannels || {}).map(([key, enabled]) => (
                      enabled ? (
                        <span key={key} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                          {deliveryLabel[key] || key}
                        </span>
                      ) : null
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(permission.edit || announcement.canEdit) && (
                    <button
                      type="button"
                      onClick={() => startEdit(announcement)}
                      className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                      title="Edit announcement"
                    >
                      <FiEdit2 size={16} />
                    </button>
                  )}

                  {(permission.delete || announcement.canDelete) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete announcement"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDismiss(announcement.id)}
                    className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                    title="Mark viewed and remove"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
