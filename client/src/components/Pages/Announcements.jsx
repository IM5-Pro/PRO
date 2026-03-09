/**
 * Announcements Page
 * Company-wide announcements and communications
 */

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiBell, FiFilter, FiFlag } from 'react-icons/fi';
import bgImage from '../../assets/ispace-bg.png';

const Announcements = () => {
  const [pinned, setPinned] = useState({ 0: true });
  const [filter, setFilter] = useState('all');
  const { colors } = useTheme();

  const announcements = [
    {
      id: 0,
      title: 'Office Holiday Schedule',
      content: 'The office will be closed on December 25-26 and January 1. Please plan your work accordingly.',
      author: 'HR Department',
      date: '2024-12-01',
      priority: 'high',
      icon: '🎄'
    },
    {
      id: 1,
      title: 'New Performance Review System',
      content: 'We\'re introducing a new performance review system. All managers will receive training next week.',
      author: 'Management',
      date: '2024-11-28',
      priority: 'medium',
      icon: '📊'
    },
    {
      id: 2,
      title: 'Cafeteria Menu Update',
      content: 'New healthy meal options are now available in the cafeteria. Check out the latest menu.',
      author: 'Facilities',
      date: '2024-11-25',
      priority: 'low',
      icon: '🍽️'
    },
    {
      id: 3,
      title: 'Infrastructure Upgrade Complete',
      content: 'Our network infrastructure upgrade has been completed. You may experience improved connectivity.',
      author: 'IT Department',
      date: '2024-11-20',
      priority: 'high',
      icon: '🔧'
    }
  ];

  const getPrioritColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'from-red-500 to-pink-500';
      case 'medium':
        return 'from-yellow-500 to-orange-500';
      case 'low':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
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
            <FiBell className="w-10 h-10" /> Announcements
          </h1>
          <p className={colors.text.tertiary}>Stay updated with company announcements</p>
        </div>

        <div className={`flex items-center gap-2 bg-gradient-to-br ${colors.gradient.card} border-2 ${colors.border.primary} rounded-xl px-4 py-3 hover:${colors.border.secondary} transition-all`}>
          <FiFilter className={colors.text.tertiary} size={20} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`bg-transparent ${colors.text.primary} outline-none font-medium`}
          >
            <option value="all">All Announcements</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`group bg-gradient-to-br ${colors.gradient.card} rounded-2xl border-2 ${colors.border.primary} p-6 hover:${colors.border.secondary} transition-all duration-300 hover:shadow-2xl ${colors.shadow} transform hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Content */}
              <div className="flex items-start gap-4 flex-1">
                {/* Icon */}
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getPrioritColor(announcement.priority)} text-white flex-shrink-0 text-2xl flex items-center justify-center`}>
                  {announcement.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-xl font-bold ${colors.text.primary} group-hover:text-blue-400 transition-colors`}>{announcement.title}</h3>
                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${getPrioritColor(announcement.priority)} text-white text-xs font-semibold flex-shrink-0`}>
                      {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                    </span>
                  </div>

                  <p className={`${colors.text.secondary} mb-3`}>{announcement.content}</p>

                  <div className="flex items-center justify-between">
                    <div className={`${colors.text.tertiary} text-sm`}>
                      <span className="font-semibold">{announcement.author}</span>
                      <span className="mx-2">•</span>
                      <span>{announcement.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pin Button */}
              <button
                onClick={() => setPinned(prev => ({ ...prev, [announcement.id]: !prev[announcement.id] }))}
                className={`p-3 ${colors.bg.tertiary}/30 hover:${colors.bg.tertiary}/50 border ${colors.border.secondary} rounded-xl ${colors.text.tertiary} hover:text-yellow-400 transition-all duration-300 flex-shrink-0`}
              >
                {pinned[announcement.id] ? <FiFlag size={20} /> : <FiBell size={20} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
