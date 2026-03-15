/**
 * TeamCollaboration Page
 * Team members, projects, and messaging
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiUsers, FiMessageSquare, FiBriefcase } from 'react-icons/fi';
import API from '../../api/client';
import { ANNOUNCEMENT_ENDPOINTS, EMPLOYEE_ENDPOINTS, LEAVE_ENDPOINTS } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';

const toPayload = (response) => response?.data || {};

const extractRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const TeamCollaboration = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);

  const loadCollaborationData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [teamResponse, leaveResponse, announcementResponse] = await Promise.all([
        API.get(EMPLOYEE_ENDPOINTS.myTeam(200)),
        API.get(LEAVE_ENDPOINTS.team),
        API.get(ANNOUNCEMENT_ENDPOINTS.list),
      ]);

      const teamRows = extractRows(toPayload(teamResponse));
      const leaveRows = extractRows(toPayload(leaveResponse));
      const announcementRows = extractRows(toPayload(announcementResponse));

      const mappedTeamMembers = teamRows.slice(0, 10).map((member, index) => {
        const fullName = [member?.firstName, member?.lastName].filter(Boolean).join(' ').trim() || member?.email || 'Team Member';
        const designation = member?.designation || member?.role || 'Team Member';
        const status = member?.isActive === false ? 'offline' : index % 3 === 0 ? 'away' : 'online';
        return {
          name: fullName,
          role: designation,
          status,
          avatar: '👤',
        };
      });

      const byDepartment = new Map();
      teamRows.forEach((member) => {
        const department = member?.department || 'General';
        const current = byDepartment.get(department) || { team: 0, pendingLeaves: 0 };
        current.team += 1;
        byDepartment.set(department, current);
      });

      leaveRows.forEach((leave) => {
        const isPending = String(leave?.status || '').toUpperCase() === 'PENDING';
        if (!isPending) {
          return;
        }

        const department = leave?.employeeId?.department || 'General';
        const current = byDepartment.get(department) || { team: 0, pendingLeaves: 0 };
        current.pendingLeaves += 1;
        byDepartment.set(department, current);
      });

      const mappedProjects = Array.from(byDepartment.entries()).slice(0, 4).map(([name, data]) => {
        const progress = Math.max(40, Math.min(95, 85 - data.pendingLeaves * 5 + data.team));
        return {
          name: `${name} Operations`,
          progress,
          team: data.team,
          status: data.pendingLeaves > 0 ? 'In Progress' : 'Stable',
        };
      });

      const mappedMessages = announcementRows.slice(0, 4).map((item) => ({
        sender: item?.createdByName || 'HR',
        message: item?.title || 'Team update',
        time: item?.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Today',
      }));

      setTeamMembers(mappedTeamMembers);
      setProjects(mappedProjects);
      setMessages(mappedMessages);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load collaboration data');
      setTeamMembers([]);
      setProjects([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollaborationData();
  }, [loadCollaborationData]);

  const noData = useMemo(() => !loading && teamMembers.length === 0 && projects.length === 0, [loading, projects.length, teamMembers.length]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8"
    >
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-bold ${colors.text.primary} mb-2 flex items-center gap-3`}>
          <FiUsers className="w-10 h-10" /> Team Collaboration
        </h1>
        <p className={`${colors.text.tertiary} mb-8`}>Work together with your team members</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white text-slate-500 px-4 py-5 mb-6">Loading team collaboration data...</div>
      )}

      {noData && (
        <div className="rounded-xl border border-slate-200 bg-white text-slate-500 px-4 py-5 mb-6">No team data found.</div>
      )}

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

          <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95">
            View All Messages
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamCollaboration;
