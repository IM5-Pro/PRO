/**
 * AdminPanelConfig Component
 * Admin panel configuration and system settings
 * Features: System settings, user permissions, system health, backups
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { FiToggleRight, FiToggleLeft, FiDownload, FiRefreshCw } from 'react-icons/fi';

const AdminPanelConfig = ({ user = {}, pageConfig = {}, onUserUpdate = () => {} }) => {
  const { colors } = useTheme();
  const [settings, setSettings] = useState({
    twoFactor: true,
    emailNotifications: true,
    autoBackup: true,
    apiAccess: false,
  });

  const systemHealth = useMemo(
    () => [
      { name: 'Database', status: 'Healthy', percentage: 85 },
      { name: 'API Server', status: 'Healthy', percentage: 92 },
      { name: 'Storage', status: 'Warning', percentage: 78 },
      { name: 'Backup', status: 'Healthy', percentage: 100 },
    ],
    []
  );

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-8 bg-white/10 backdrop-blur-3xl border border-white/30 ring-1 ring-white/20 shadow-xl shadow-slate-900/10 animate-slideInDown">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          🔧 Admin Panel Configuration
        </h1>
        <p className="text-slate-600">Configure system settings and admin preferences</p>
      </div>

      {/* System Health */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {systemHealth.map((item) => (
            <div key={item.name} className="card animate-fadeInUp hover-lift">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-800 font-semibold">{item.name}</p>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    item.status === 'Healthy'
                      ? 'bg-green-600/20 text-green-300'
                      : item.status === 'Warning'
                      ? 'bg-yellow-600/20 text-yellow-300'
                      : 'bg-red-600/20 text-red-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <p className={`${colors.text.muted} text-xs mt-2`}>{item.percentage}% utilization</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 mb-8`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Security Settings</h2>
        <div className="space-y-4">
          {[
            { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require 2FA for all users' },
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send security alerts via email' },
            { key: 'autoBackup', label: 'Automatic Backups', desc: 'Enable daily automated backups' },
            { key: 'apiAccess', label: 'API Access', desc: 'Allow third-party API access' },
          ].map((setting) => (
            <div
              key={setting.key}
              className={`flex items-center justify-between p-4 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-lg hover:${colors.bg.tertiary}/50 transition-all`}
            >
              <div>
                <p className={`${colors.text.primary} font-semibold`}>{setting.label}</p>
                <p className={`${colors.text.tertiary} text-sm`}>{setting.desc}</p>
              </div>
              <button
                onClick={() => toggleSetting(setting.key)}
                className="transition-all duration-300"
              >
                {settings[setting.key] ? (
                  <FiToggleRight size={32} className="text-green-500" />
                ) : (
                  <FiToggleLeft size={32} className="text-slate-500" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backup & Maintenance */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 mb-8`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Backup & Maintenance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className={`flex items-center gap-3 px-6 py-4 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-lg hover:border-blue-500/50 transition-all`}>
            <FiDownload size={20} className="text-blue-400" />
            <div className="text-left">
              <p className={`${colors.text.primary} font-semibold`}>Download Backup</p>
              <p className={`${colors.text.tertiary} text-xs`}>Last backup: 2 hours ago</p>
            </div>
          </button>
          <button className={`flex items-center gap-3 px-6 py-4 ${colors.bg.tertiary}/30 border ${colors.border.secondary} rounded-lg hover:border-green-500/50 transition-all`}>
            <FiRefreshCw size={20} className="text-green-400" />
            <div className="text-left">
              <p className={`${colors.text.primary} font-semibold`}>Run Maintenance</p>
              <p className={`${colors.text.tertiary} text-xs`}>Optimize database</p>
            </div>
          </button>
        </div>
      </div>

      {/* Email Configuration */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6`}>
        <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Email Configuration</h2>
        <div className="space-y-4">
          {['SMTP Server', 'SMTP Port', 'Admin Email', 'Sender Name'].map((field, idx) => (
            <div key={idx}>
              <label className={`${colors.text.tertiary} text-sm font-semibold mb-2 block`}>{field}</label>
              <input
                type="text"
                placeholder={`Enter ${field.toLowerCase()}`}
                className={`w-full px-4 py-2 ${colors.bg.secondary} border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              />
            </div>
          ))}
          <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all mt-4">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelConfig;
