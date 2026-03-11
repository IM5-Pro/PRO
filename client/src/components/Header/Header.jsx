/**
 * Header Component
 * Displays the top header with user info and notifications
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiChevronDown, FiSearch, FiSquare, FiPlay } from 'react-icons/fi';

/**
 * Header Component
 * @param {object} props - Component props
 * @param {object} props.user - Current user object with name, email, avatar
 * @returns {JSX.Element} - Header component
 */
const Header = ({ user = { name: 'John Doe', email: 'john@example.com', avatar: '🧑' } }) => {
  // State for dropdown menu visibility
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications] = useState(3);

  // punch state
  const navigate = useNavigate();
  const isPunchedIn = localStorage.getItem('isPunchedIn') === 'true';

  const handlePunchAction = () => {
    navigate('/punch');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right Section - Punch button, notifications and User Profile */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Punch In/Out Button */}
          <button
            onClick={handlePunchAction}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
              isPunchedIn
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            }`}
            title={isPunchedIn ? 'Click to punch out for the day' : 'Click to punch in for the day'}
          >
            {isPunchedIn ? (
              <>
                <FiSquare size={18} />
                <span className="text-sm font-semibold hidden sm:inline">Punch Out</span>
              </>
            ) : (
              <>
                <FiPlay size={18} />
                <span className="text-sm font-semibold hidden sm:inline">Punch In</span>
              </>
            )}
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            aria-label="Notifications"
          >
            <FiBell size={20} />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="User menu"
            >
              <span className="text-2xl">{user.avatar}</span>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <FiChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  showDropdown ? 'transform rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">
                  My Profile
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">
                  Settings
                </button>
                <hr className="my-2" />
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
