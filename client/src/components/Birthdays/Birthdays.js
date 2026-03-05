/**
 * Birthdays Component
 * Displays upcoming employee birthdays
 */

import React from 'react';
import { FiGift, FiHeart } from 'react-icons/fi';

/**
 * Birthdays Component - Shows upcoming birthdays
 * @returns {JSX.Element} - Birthdays component
 */
const Birthdays = () => {
  // Sample birthdays data
  const birthdays = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Product Manager',
      date: '2024-03-06',
      daysUntil: 1,
      avatar: '👩‍💼',
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Senior developer',
      date: '2024-03-08',
      daysUntil: 3,
      avatar: '👨‍💻',
    },
    {
      id: 3,
      name: 'Emma Davis',
      role: 'UI Designer',
      date: '2024-03-12',
      daysUntil: 7,
      avatar: '👩‍🎨',
    },
    {
      id: 4,
      name: 'David Wilson',
      role: 'QA Engineer',
      date: '2024-03-15',
      daysUntil: 10,
      avatar: '👨‍🔬',
    },
  ];

  /**
   * Get days remaining text
   * @param {number} daysUntil - Days until birthday
   * @returns {string} - Formatted days text
   */
  const getDaysText = (daysUntil) => {
    if (daysUntil === 0) return 'Today 🎉';
    if (daysUntil === 1) return 'Tomorrow 🎁';
    return `In ${daysUntil} days`;
  };

  /**
   * Get urgency color based on days
   * @param {number} daysUntil - Days until birthday
   * @returns {string} - Tailwind color classes
   */
  const getUrgencyColor = (daysUntil) => {
    if (daysUntil <= 1) return 'border-l-4 border-purple-500 bg-purple-50';
    if (daysUntil <= 3) return 'border-l-4 border-pink-500 bg-pink-50';
    return 'border-l-4 border-blue-500 bg-blue-50';
  };

  return (
    <div className="card w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiGift className="text-orange-600" size={20} />
          Birthdays
        </h2>
        <span className="badge bg-orange-100 text-orange-800">{birthdays.length}</span>
      </div>

      {/* Birthdays List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {birthdays.map((person) => (
          <div
            key={person.id}
            className={`p-3 rounded-lg ${getUrgencyColor(person.daysUntil)}`}
          >
            {/* Person Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{person.avatar}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{person.name}</p>
                  <p className="text-xs text-gray-600">{person.role}</p>
                </div>
              </div>
            </div>

            {/* Days Until */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700">
                {getDaysText(person.daysUntil)}
              </p>
              <button
                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors duration-200"
                aria-label={`Send wishes to ${person.name}`}
              >
                <FiHeart size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Birthday Reminder */}
      <button className="w-full btn-secondary text-sm mt-4">Send Wishes to All</button>
    </div>
  );
};

export default Birthdays;
