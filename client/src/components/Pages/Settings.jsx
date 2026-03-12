/**
 * Settings Page
 * User and application settings management
 */

import React, { useState } from 'react';
import { FiSettings, FiBell, FiLock, FiEye, FiEyeOff, FiToggleRight, FiToggleLeft, FiLogOut, FiTrash2, FiSave } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import bgImage from '../../assets/Background.png';

const SettingsPage = () => {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    leaveNotifications: true,
    twoFactor: false,
    profileVisibility: true,
    announcementUpdates: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.94)), url(${bgImage})` }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiSettings className="w-10 h-10" /> Settings
        </h1>
        <p className={colors.text.tertiary}>Manage your account, notifications, and preferences</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Menu */}
        <div className="lg:col-span-1">
          <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 sticky top-6`}>
            <h3 className={`${colors.text.primary} font-semibold mb-4`}>Settings</h3>
            <div className="space-y-2">
              {[
                { icon: FiBell, label: 'Notifications', id: 'notifications' },
                { icon: FiLock, label: 'Security', id: 'security' },
                { icon: FiEye, label: 'Privacy', id: 'privacy' },
                { icon: FiSettings, label: 'General', id: 'general' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${colors.text.tertiary} hover:${colors.text.primary} hover:bg-slate-700/50 transition-all duration-300 font-medium`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Settings */}
          <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6 flex items-center gap-2`}>
              <FiBell className="text-blue-400" /> Notification Preferences
            </h2>

            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive updates via email', key: 'emailNotifications' },
                { label: 'Push Notifications', desc: 'Enable browser notifications', key: 'pushNotifications' },
                { label: 'Leave Updates', desc: 'Get notified about leave requests', key: 'leaveNotifications' },
                { label: 'Announcement Updates', desc: 'Receive important announcements', key: 'announcementUpdates' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-colors duration-300"
                >
                  <div>
                    <p className={`${colors.text.primary} font-semibold`}>{item.label}</p>
                    <p className={`${colors.text.tertiary} text-sm`}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(item.key)}
                    className="transform transition-transform duration-300"
                  >
                    {settings[item.key] ? (
                      <FiToggleRight className="text-green-500" size={32} />
                    ) : (
                      <FiToggleLeft className="text-slate-500" size={32} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security Settings */}
          <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6 flex items-center gap-2`}>
              <FiLock className="text-yellow-400" /> Security Settings
            </h2>

            <div className="space-y-6">
              {/* Change Password */}
              <div>
                <h3 className={`${colors.text.primary} font-semibold mb-4`}>Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className={`w-full px-4 py-3 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-300`}
                    />
                  </div>
                  <div>
                    <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        className={`w-full px-4 py-3 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-300`}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-3 ${colors.text.tertiary} hover:${colors.text.primary} transition-colors`}
                      >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        className={`w-full px-4 py-3 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-300`}
                      />
                      <button
                        onClick={() => setShowConfirm(!showConfirm)}
                        className={`absolute right-3 top-3 ${colors.text.tertiary} hover:${colors.text.primary} transition-colors`}
                      >
                        {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Factor Authentication */}
              <div className="border-t border-slate-600 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${colors.text.primary} font-semibold`}>Two-Factor Authentication</p>
                    <p className={`${colors.text.tertiary} text-sm`}>Add an extra layer of security to your account</p>
                  </div>
                  <button onClick={() => toggleSetting('twoFactor')} className="transform transition-transform duration-300">
                    {settings.twoFactor ? (
                      <FiToggleRight className="text-green-500" size={32} />
                    ) : (
                      <FiToggleLeft className="text-slate-500" size={32} />
                    )}
                  </button>
                </div>
              </div>

              {/* Save Changes */}
              <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                <FiSave size={20} /> Save Changes
              </button>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all duration-300`}>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6 flex items-center gap-2`}>
              <FiEye className="text-purple-400" /> Privacy Settings
            </h2>

            <div className="space-y-4">
              {[
                { label: 'Profile Visibility', desc: 'Make profile visible to other employees', key: 'profileVisibility' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-colors duration-300"
                >
                  <div>
                    <p className={`${colors.text.primary} font-semibold`}>{item.label}</p>
                    <p className={`${colors.text.tertiary} text-sm`}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(item.key)}
                    className="transform transition-transform duration-300"
                  >
                    {settings[item.key] ? (
                      <FiToggleRight className="text-green-500" size={32} />
                    ) : (
                      <FiToggleLeft className="text-slate-500" size={32} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-700/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-2">
              <FiTrash2 /> Danger Zone
            </h2>

            <div className="space-y-4">
              <button
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <FiLogOut size={20} /> Sign Out
              </button>

              <button className="w-full px-6 py-3 bg-gradient-to-r from-red-600/50 to-red-700/50 hover:from-red-600 hover:to-red-700 text-red-100 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border border-red-600">
                <FiTrash2 size={20} /> Delete Account
              </button>

              <p className="text-red-300/70 text-xs text-center">
                Warning: Deleting your account is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
