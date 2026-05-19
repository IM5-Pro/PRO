/**
 * Settings Page — fixed left nav; only the right pane scrolls.
 * Notification toggles persist in localStorage; password uses POST /auth/change-password.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiBell,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiLock,
  FiLogOut,
  FiSave,
  FiSettings,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/client';
import { AUTH_ENDPOINTS } from '../../api/endpoints';

const SETTINGS_NAV = [
  { icon: FiBell, label: 'Notifications', id: 'notifications' },
  { icon: FiLock, label: 'Security', id: 'security' },
  { icon: FiEye, label: 'Privacy', id: 'privacy' },
  { icon: FiGlobe, label: 'General', id: 'general' },
];

const DEFAULT_PREFS = {
  emailNotifications: true,
  pushNotifications: false,
  leaveNotifications: true,
  announcementUpdates: true,
  twoFactor: false,
  profileVisibility: true,
};

const PREFS_STORAGE_KEY = 'hrms_settings_prefs_v1';

const loadStoredPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

const SettingsPage = () => {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [prefs, setPrefs] = useState(loadStoredPrefs);
  const [activeSection, setActiveSection] = useState('notifications');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [prefsHint, setPrefsHint] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore quota */
    }
  }, [prefs]);

  const flashPrefsSaved = () => {
    setPrefsHint('Saved on this device.');
    window.setTimeout(() => setPrefsHint(''), 2200);
  };

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    flashPrefsSaved();
  };

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(`settings-section-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;

    const updateActive = () => {
      const marker = root.getBoundingClientRect().top + 40;
      let current = SETTINGS_NAV[0].id;
      for (const { id } of SETTINGS_NAV) {
        const el = document.getElementById(`settings-section-${id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= marker) current = id;
      }
      setActiveSection(current);
    };

    updateActive();
    root.addEventListener('scroll', updateActive, { passive: true });
    return () => root.removeEventListener('scroll', updateActive);
  }, []);

  const handlePasswordField = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage({ type: '', text: '' });
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMessage({ type: 'error', text: 'Current and new password are required.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation must match.' });
      return;
    }
    setPasswordBusy(true);
    try {
      await API.post(AUTH_ENDPOINTS.changePassword, {
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Could not update password.';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setPasswordBusy(false);
    }
  };

  const navButtonClass = (id) =>
    [
      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors duration-200 border',
      activeSection === id
        ? 'bg-blue-50 text-blue-900 border-blue-200 shadow-sm'
        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');

  const cardClass = `rounded-2xl border ${colors.border.primary} bg-gradient-to-br ${colors.gradient.card} p-6 shadow-sm`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 lg:flex-row">
      <aside className="flex w-full flex-shrink-0 flex-col border-slate-200/80 bg-gradient-to-br from-white to-slate-50 px-5 py-6 lg:w-60 lg:border-r lg:px-4 lg:py-8 xl:w-64">
        <div className="mb-6 flex items-center gap-3 lg:flex-col lg:items-start">
          <FiSettings className="h-8 w-8 shrink-0 text-slate-700" aria-hidden />
          <div>
            <h1 className={`text-xl font-bold ${colors.text.primary}`}>Settings</h1>
            <p className={`mt-1 text-xs ${colors.text.tertiary}`}>Account & preferences</p>
          </div>
        </div>
        <nav className="space-y-1" aria-label="Settings sections">
          {SETTINGS_NAV.map(({ icon: Icon, label, id }) => (
            <button key={id} type="button" className={navButtonClass(id)} onClick={() => scrollToSection(id)}>
              <Icon size={18} className="shrink-0 opacity-80" aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div
        ref={scrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-6 md:px-8 md:py-8"
        tabIndex={0}
        role="region"
        aria-label="Settings details"
      >
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
          {prefsHint ? <p className="text-sm text-emerald-700">{prefsHint}</p> : null}

          <section id="settings-section-notifications" className={`scroll-mt-4 ${cardClass}`}>
            <h2 className={`mb-6 flex items-center gap-2 text-2xl font-bold ${colors.text.primary}`}>
              <FiBell className="text-blue-500" aria-hidden />
              Notification preferences
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Email notifications', desc: 'Receive updates via email', key: 'emailNotifications' },
                { label: 'Push notifications', desc: 'Browser notifications (when supported)', key: 'pushNotifications' },
                { label: 'Leave updates', desc: 'Leave request status and reminders', key: 'leaveNotifications' },
                { label: 'Announcements', desc: 'Important company announcements', key: 'announcementUpdates' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white/60 p-4"
                >
                  <div>
                    <p className={`font-semibold ${colors.text.primary}`}>{item.label}</p>
                    <p className={`text-sm ${colors.text.tertiary}`}>{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePref(item.key)}
                    className="shrink-0 transition-transform duration-200 hover:opacity-90"
                    aria-pressed={prefs[item.key]}
                    aria-label={`Toggle ${item.label}`}
                  >
                    {prefs[item.key] ? (
                      <FiToggleRight className="text-emerald-600" size={32} />
                    ) : (
                      <FiToggleLeft className="text-slate-400" size={32} />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className={`mt-4 text-xs ${colors.text.muted}`}>
              These preferences are stored on this device. Server-driven alerts may still apply per company policy.
            </p>
          </section>

          <section id="settings-section-security" className={`scroll-mt-4 ${cardClass}`}>
            <h2 className={`mb-6 flex items-center gap-2 text-2xl font-bold ${colors.text.primary}`}>
              <FiLock className="text-amber-500" aria-hidden />
              Security
            </h2>

            <form onSubmit={handleSavePassword} className="space-y-6">
              <div>
                <h3 className={`mb-4 font-semibold ${colors.text.primary}`}>Change password</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${colors.text.secondary}`} htmlFor="settings-current-password">
                      Current password
                    </label>
                    <input
                      id="settings-current-password"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordField}
                      className={`w-full rounded-lg border ${colors.border.secondary} bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${colors.text.secondary}`} htmlFor="settings-new-password">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="settings-new-password"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordField}
                        className={`w-full rounded-lg border ${colors.border.secondary} bg-white px-4 py-3 pr-12 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${colors.text.secondary}`} htmlFor="settings-confirm-password">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        id="settings-confirm-password"
                        name="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordField}
                        className={`w-full rounded-lg border ${colors.border.secondary} bg-white px-4 py-3 pr-12 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {passwordMessage.text ? (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    passwordMessage.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-red-200 bg-red-50 text-red-800'
                  }`}
                  role="status"
                >
                  {passwordMessage.text}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={passwordBusy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSave size={20} aria-hidden />
                {passwordBusy ? 'Saving…' : 'Update password'}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200/80 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`font-semibold ${colors.text.primary}`}>Two-factor authentication</p>
                  <p className={`text-sm ${colors.text.tertiary}`}>Extra verification at sign-in (coming soon)</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePref('twoFactor')}
                  className="shrink-0 self-start sm:self-auto"
                  aria-pressed={prefs.twoFactor}
                  aria-label="Toggle two-factor authentication preference"
                >
                  {prefs.twoFactor ? (
                    <FiToggleRight className="text-emerald-600" size={32} />
                  ) : (
                    <FiToggleLeft className="text-slate-400" size={32} />
                  )}
                </button>
              </div>
            </div>
          </section>

          <section id="settings-section-privacy" className={`scroll-mt-4 ${cardClass}`}>
            <h2 className={`mb-6 flex items-center gap-2 text-2xl font-bold ${colors.text.primary}`}>
              <FiEye className="text-violet-500" aria-hidden />
              Privacy
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white/60 p-4">
                <div>
                  <p className={`font-semibold ${colors.text.primary}`}>Profile visibility</p>
                  <p className={`text-sm ${colors.text.tertiary}`}>Show basic profile to colleagues in directory views</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePref('profileVisibility')}
                  className="shrink-0"
                  aria-pressed={prefs.profileVisibility}
                  aria-label="Toggle profile visibility preference"
                >
                  {prefs.profileVisibility ? (
                    <FiToggleRight className="text-emerald-600" size={32} />
                  ) : (
                    <FiToggleLeft className="text-slate-400" size={32} />
                  )}
                </button>
              </div>
            </div>
          </section>

          <section id="settings-section-general" className={`scroll-mt-4 ${cardClass}`}>
            <h2 className={`mb-6 flex items-center gap-2 text-2xl font-bold ${colors.text.primary}`}>
              <FiGlobe className="text-slate-600" aria-hidden />
              General
            </h2>
            <p className={`mb-4 text-sm ${colors.text.secondary}`}>
              Workspace defaults such as language, date format, and theme are controlled by your organization. Contact HR
              if you need a change.
            </p>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200/80 bg-white/60 px-4 py-3">
                <dt className={`text-xs uppercase tracking-wide ${colors.text.muted}`}>Language</dt>
                <dd className={`mt-1 font-medium ${colors.text.primary}`}>English</dd>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-white/60 px-4 py-3">
                <dt className={`text-xs uppercase tracking-wide ${colors.text.muted}`}>Appearance</dt>
                <dd className={`mt-1 font-medium ${colors.text.primary}`}>Light</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/90 to-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-red-800">
              <FiTrash2 aria-hidden />
              Session & account
            </h2>
            <div className="space-y-4">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                <FiLogOut size={20} aria-hidden />
                Sign out
              </button>
              <button
                type="button"
                disabled
                title="Account deletion must be requested through HR."
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-6 py-3 font-semibold text-red-400"
              >
                <FiTrash2 size={20} aria-hidden />
                Delete account
              </button>
              <p className="text-center text-xs text-red-700/80">Deleting an account is permanent. Use HR for account closure.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
