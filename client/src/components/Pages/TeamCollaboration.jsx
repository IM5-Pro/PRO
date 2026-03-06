/**
 * TeamCollaboration Page
 * Team members, projects, and messaging
 */

import React from 'react';
import { FiUsers, FiMessageSquare, FiBriefcase } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const TeamCollaboration = () => {
  const { colors } = useTheme();
  const teamMembers = [
    { name: 'Sarah Johnson', role: 'Product Lead', status: 'online', avatar: '👩‍💼' },
    { name: 'Mike Chen', role: 'Backend Developer', status: 'online', avatar: '👨‍💻' },
    { name: 'Emily Davis', role: 'UI/UX Designer', status: 'away', avatar: '👩‍🎨' },
    { name: 'Alex Rodriguez', role: 'QA Engineer', status: 'online', avatar: '👨‍🔧' },
    { name: 'Lisa Park', role: 'DevOps Engineer', status: 'offline', avatar: '👩‍💻' }
  ];

  const projects = [
    { name: 'Dashboard Redesign', progress: 85, team: 4, status: 'In Progress' },
    { name: 'API Integration', progress: 60, team: 3, status: 'In Progress' },
    { name: 'Mobile App Development', progress: 45, team: 5, status: 'Planning' },
    { name: 'Performance Optimization', progress: 90, team: 2, status: 'Nearing Completion' }
  ];

  const messages = [
    { sender: 'Sarah Johnson', message: 'Great work on the UI improvements!', time: '2 hours ago' },
    { sender: 'Mike Chen', message: 'API endpoints are ready for integration', time: '3 hours ago' },
    { sender: 'Emily Davis', message: 'Design mockups updated in Figma', time: 'Yesterday' },
    { sender: 'Team Chat', message: 'Sprint planning meeting at 2:00 PM', time: 'Yesterday' }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient.primary} p-6 md:p-8`}>
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiUsers className="w-10 h-10" /> Team Collaboration
        </h1>
        <p className={`${colors.text.tertiary} mb-8`}>Work together with your team members</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className={`background-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Team Members</h2>

          <div className="space-y-3">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{member.avatar}</span>
                  <div>
                    <p className={`${colors.text.primary} font-semibold`}>{member.name}</p>
                    <p className={`${colors.text.tertiary} text-xs`}>{member.role}</p>
                  </div>
                </div>

                <div className={`w-3 h-3 rounded-full ${
                  member.status === 'online'
                    ? 'bg-green-500'
                    : member.status === 'away'
                    ? 'bg-yellow-500'
                    : 'bg-slate-500'
                }`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Projects */}
        <div className={`background-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6 flex items-center gap-2`}>
            <FiBriefcase className="text-blue-400" /> Active Projects
          </h2>

          <div className="space-y-4">
            {projects.map((project, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <p className={`${colors.text.primary} font-semibold`}>{project.name}</p>
                  <span className={`${colors.text.tertiary} text-xs`}>{project.progress}%</span>
                </div>
                <div className={`w-full h-2 ${colors.bg.tertiary} rounded-full overflow-hidden mb-2`}>
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span className={`${colors.text.tertiary} text-xs`}>{project.team} members</span>
                  <span className="text-green-400 text-xs font-semibold">{project.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className={`background-to-br ${colors.gradient.card} rounded-2xl border ${colors.border.primary} p-6 hover:border-slate-600 transition-all`}>
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6 flex items-center gap-2`}>
            <FiMessageSquare className="text-green-400" /> Messages
          </h2>

          <div className="space-y-3 max-h-96">
            {messages.map((msg, idx) => (
              <div key={idx} className="p-3 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                <p className={`${colors.text.primary} font-semibold text-sm`}>{msg.sender}</p>
                <p className={`${colors.text.secondary} text-sm mt-1`}>{msg.message}</p>
                <p className={`${colors.text.muted} text-xs mt-2`}>{msg.time}</p>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95">
            View All Messages
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamCollaboration;
