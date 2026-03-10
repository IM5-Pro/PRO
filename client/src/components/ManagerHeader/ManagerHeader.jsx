/**
 * ManagerHeader Component
 * Top navigation header for manager dashboard with search, filters, and profile menu
 * Features: Search functionality, notification badge, time display, user profile dropdown
 * 
 * @component
 * @example
 * <ManagerHeader user={currentUser} />
 */

import React, { useState } from 'react';
import {
  FiSearch,
  FiBell,
  FiChevronDown,
  FiFilter,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';

/**
 * ManagerHeader Component
 * Displays top navigation with search, filters, time, and user profile
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object with name, avatar, email
 * @param {Function} props.onProfileClick - Callback when profile is clicked
 * @returns {JSX.Element} Header component
 */
const ManagerHeader = ({
  user = { name: 'Sourav', email: 'sourav@example.com', avatar: '👨‍💼' },
  onProfileClick = () => {},
}) => {
  // State for time display
  const [currentTime, setCurrentTime] = useState(new Date());

  // State for dropdown menu
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  /**
   * Format time to HH:MM AM/PM format
   * @returns {string} Formatted time string
   */
  const getFormattedTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Get greeting message based on time of day
   * @returns {string} Greeting message
   */
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Left Section - Search and Greeting */}
        <div className="flex-1 flex items-center gap-4">
          {/* Search Input */}
          <div className="hidden md:flex flex-1 max-w-md relative group">
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 group-focus-within:text-blue-700 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-400 text-gray-900 placeholder-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-md font-medium"
              aria-label="Search"
            />
          </div>

          {/* Greeting Text (Mobile view) */}
          <div className="md:hidden">
            <p className="text-sm font-semibold text-gray-800">{getGreeting()}, {user.name}!</p>
          </div>

          {/* Greeting Text (Desktop view) */}
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">
              {getGreeting()}, {user.name}!
            </p>
          </div>
        </div>

        {/* Right Section - Actions and Profile */}
        <div className="flex items-center gap-4 ml-4">
          {/* Current Time Display */}
          <div className="hidden lg:flex flex-col items-end pr-4 border-r border-gray-200">
            <p className="text-xs text-gray-500">Current time</p>
            <p className="text-lg font-bold text-gray-800 font-mono">
              {getFormattedTime()}
            </p>
          </div>

          {/* Filter Button */}
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Filter"
            aria-label="Open filters"
          >
            <FiFilter size={20} />
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Notifications"
            aria-label="Notifications"
          >
            <FiBell size={20} />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              1
            </span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="User profile menu"
            >
              <span className="text-2xl">{user.avatar}</span>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                {/* Show user email if available */}
              </div>
              <FiChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fadeIn"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                {/* Profile Item */}
                <button
                  onClick={() => {
                    onProfileClick('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 transition-colors flex items-center gap-2"
                >
                  <FiUser size={16} />
                  My Profile
                </button>

                {/* Divider */}
                <hr className="my-1" />

                {/* Logout Item */}
                <button
                  onClick={() => {
                    onProfileClick('logout');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 transition-colors flex items-center gap-2"
                >
                  <FiLogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Tabs for Desktop Navigation (if needed) */}
      <div className="hidden md:flex border-t border-gray-200 px-8">
        <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 text-sm font-semibold">
          Dashboard
        </button>
        <button className="px-4 py-3 text-gray-600 text-sm hover:text-gray-800 transition-colors">
          Leave
        </button>
        <button className="px-4 py-3 text-gray-600 text-sm hover:text-gray-800 transition-colors">
          Attendance
        </button>
        <button className="px-4 py-3 text-gray-600 text-sm hover:text-gray-800 transition-colors">
          Performance
        </button>
      </div>
    </header>
  );
};

export default ManagerHeader;
