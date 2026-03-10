/**
 * EmployeeProfile Page
 * Employee personal and professional information
 */

import React, { useState } from 'react';
import { FiUser, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import bgImage from '../../assets/Background.png';

const EmployeeProfile = () => {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const profile = {
    name: 'John Doe',
    position: 'Senior Frontend Developer',
    department: 'Engineering',
    email: 'john.doe@company.com',
    phone: '+1-234-567-8900',
    location: 'New York, USA',
    joinDate: '2022-01-15',
    bio: 'Passionate full-stack developer with 6+ years of experience building scalable web applications.',
    avatar: '👨‍💼'
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed p-6 md:p-8"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
            <FiUser className="w-10 h-10" /> My Profile
          </h1>
          <p className={colors.text.tertiary}>View and manage your profile information</p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <FiX size={20} /> Cancel
            </>
          ) : (
            <>
              <FiEdit2 size={20} /> Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Profile Card */}
      <div className={`bg-gradient-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-8 hover:border-slate-600 transition-all mb-8`}>
        <div className="flex items-center gap-6 mb-8">
          <div className="text-7xl bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-4">
            {profile.avatar}
          </div>

          <div className="flex-1">
            <h2 className={`text-3xl font-bold ${colors.text.primary} mb-2`}>{profile.name}</h2>
            <p className="text-blue-400 text-lg font-semibold mb-2">{profile.position}</p>
            <p className={colors.text.tertiary}>{profile.department} • Joined {profile.joinDate}</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Full Name</label>
            {isEditing ? (
              <input
                type="text"
                defaultValue={profile.name}
                className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`}
              />
            ) : (
              <p className={`${colors.text.primary} font-medium`}>{profile.name}</p>
            )}
          </div>

          <div>
            <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Position</label>
            {isEditing ? (
              <input
                type="text"
                defaultValue={profile.position}
                className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`}
              />
            ) : (
              <p className={`${colors.text.primary} font-medium`}>{profile.position}</p>
            )}
          </div>

          <div>
            <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Email</label>
            {isEditing ? (
              <input
                type="email"
                defaultValue={profile.email}
                className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`}
              />
            ) : (
              <p className={`${colors.text.primary} font-medium`}>{profile.email}</p>
            )}
          </div>

          <div>
            <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Phone</label>
            {isEditing ? (
              <input
                type="tel"
                defaultValue={profile.phone}
                className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`}
              />
            ) : (
              <p className={`${colors.text.primary} font-medium`}>{profile.phone}</p>
            )}
          </div>

          <div>
            <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Department</label>
            {isEditing ? (
              <input
                type="text"
                defaultValue={profile.department}
                className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`}
              />
            ) : (
              <p className={`${colors.text.primary} font-medium`}>{profile.department}</p>
            )}
          </div>

          <div>
            <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Location</label>
            {isEditing ? (
              <input
                type="text"
                defaultValue={profile.location}
                className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors`}
              />
            ) : (
              <p className={`${colors.text.primary} font-medium`}>{profile.location}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <label className={`block ${colors.text.secondary} text-sm font-medium mb-2`}>Bio</label>
          {isEditing ? (
            <textarea
              defaultValue={profile.bio}
              className={`w-full px-4 py-2 bg-slate-700/50 border ${colors.border.secondary} ${colors.text.primary} rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none`}
              rows="4"
            ></textarea>
          ) : (
            <p className={colors.text.secondary}>{profile.bio}</p>
          )}
        </div>

        {/* Save Button */}
        {isEditing && (
          <button className="mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2">
            <FiSave size={20} /> Save Changes
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
