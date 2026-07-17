/**
 * Announcements Component
 * Displays company announcements and news
 */

import React from 'react';
import { FiMessageSquare, FiVolume2, FiXCircle } from 'react-icons/fi';

/**
 * Announcements Component - Shows company announcements
 * @returns {JSX.Element} - Announcements component
 */
const Announcements = () => {
  // Sample announcements data
  const [announcements, setAnnouncements] = React.useState([
    {
      id: 1,
      title: 'New Office Reopening',
      message: 'Our new office in downtown is now open. Welcome!' ,
      date: '2024-03-05',
      type: 'info',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Holiday Schedule Updated',
      message: 'Check the updated holiday schedule for the upcoming months.',
      date: '2024-03-01',
      type: 'warning',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Team Outing - This Saturday',
      message: 'Join us for team building activities at the beach. Register soon!',
      date: '2024-02-28',
      type: 'success',
      priority: 'low',
    },
  ]);

  /**
   * Remove an announcement
   * @param {number} id - The announcement ID to remove
   */
  const removeAnnouncement = (id) => {
    setAnnouncements(announcements.filter((ann) => ann.id !== id));
  };

  /**
   * Get color based on priority
   * @param {string} priority - Priority level
   * @returns {string} - Tailwind color classes
   */
  const getPriorityColor = (priority) => {
    // Map priority to colors
    const colors = {
      high: 'border-l-4 border-red-500 bg-red-50',
      medium: 'border-l-4 border-yellow-500 bg-yellow-50',
      low: 'border-l-4 border-green-500 bg-green-50',
    };
    return colors[priority] || colors.low;
  };

  /**
   * Get priority badge color
   * @param {string} priority - Priority level
   * @returns {string} - Badge color class
   */
  const getPriorityBadgeColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || colors.low;
  };

  return (
    <div className="card w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiMessageSquare size={20} className="text-blue-600" />
          Announcements
        </h2>
        <span className="badge bg-blue-100 text-blue-800">{announcements.length}</span>
      </div>

      {/* Announcements List */}
      {announcements.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-4 rounded-lg ${getPriorityColor(announcement.priority)}`}
            >
              {/* Announcement Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                    <span className={`badge text-xs ${getPriorityBadgeColor(announcement.priority)}`}>
                      {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{announcement.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(announcement.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removeAnnouncement(announcement.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200"
                  aria-label="Dismiss announcement"
                >
                  <FiXCircle size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <FiVolume2 className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">No announcements at the moment</p>
        </div>
      )}

      {/* View All Button */}
      {announcements.length > 0 && (
        <button className="w-full btn-secondary text-sm mt-4">View All Announcements</button>
      )}
    </div>
  );
};

export default Announcements;
