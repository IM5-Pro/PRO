/**
 * HRHeader Component
 * Top navigation header for HR dashboard with search, live notifications, and profile menu
 * Features: Real-time search, live notification badge, time display, user profile dropdown with actions
 * Notifications are powered by NotificationContext for real-time updates
 * 
 * @component
 * @author HR Team
 * @version 2.0.0
 * @example
 * <HRHeader 
 *   user={currentUser} 
 *   onProfileClick={handleAction}
 * />
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut, FiSettings, FiLogIn } from 'react-icons/fi';
import { usePunch } from '../../context/PunchContext';
import { useNotifications } from '../../context/NotificationContext';

/**
 * Validation constants for header inputs
 * @type {Object}
 */
const VALIDATION_RULES = {
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
};

/**
 * HRHeader Component
 * Displays top navigation with search functionality, live notifications, and user profile menu
 * Notifications are automatically fetched from NotificationContext based on user role
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {string} props.user.name - User's full name
 * @param {string} props.user.email - User's email address
 * @param {string} props.user.avatar - User's avatar emoji or URL
 * @param {string} props.user.role - User's role (super_admin, hr_admin, manager, employee)
 * @param {Function} props.onProfileClick - Callback when profile actions are clicked
 * @returns {JSX.Element} Header component with all controls and menus
 */
const HRHeader = ({
  user = { name: 'HR Admin', email: 'hr@company.com', avatar: '👨‍💼', role: 'hr_admin' },
  onProfileClick = () => {},
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Punch state from shared context
  const { canPunch, punchStatus, loading: punchLoading, locationLabel: punchLocationLabel, punchIn: handlePunchIn, punchOut: handlePunchOut } = usePunch();

  // Notification state and actions from context
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Update time display every minute
   * Cleanup timer on component unmount
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);



  /**
   * Close menus when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      const notificationTrigger = document.querySelector('[data-menu-trigger="notifications"]');
      const profileTrigger = document.querySelector('[data-menu-trigger="profile"]');
      
      const isNotificationClick = notificationTrigger?.contains(e.target) || e.target.closest('[data-menu-trigger="notifications"]');
      const isProfileClick = profileTrigger?.contains(e.target) || e.target.closest('[data-menu-trigger="profile"]');
      
      if (!isNotificationClick && showNotifications) {
        setShowNotifications(false);
      }
      
      if (!isProfileClick && showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    if (showNotifications || showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNotifications, showProfileMenu]);

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Validate search query
   * @param {string} query - Search query to validate
   * @returns {Object} Validation result with isValid and error message
   */
  const validateSearchQuery = useCallback((query) => {
    if (!query.trim()) {
      return { isValid: true, error: null };
    }

    if (query.length < VALIDATION_RULES.SEARCH_MIN_LENGTH) {
      return {
        isValid: false,
        error: `Search term must be at least ${VALIDATION_RULES.SEARCH_MIN_LENGTH} characters`,
      };
    }

    if (query.length > VALIDATION_RULES.SEARCH_MAX_LENGTH) {
      return {
        isValid: false,
        error: `Search term must not exceed ${VALIDATION_RULES.SEARCH_MAX_LENGTH} characters`,
      };
    }

    return { isValid: true, error: null };
  }, []);

  /**
   * Validate user data
   * @param {Object} userData - User data to validate
   * @returns {boolean} True if user data is valid
   */
  const validateUserData = useCallback((userData) => {
    return userData && userData.name && userData.email && userData.role;
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle search input change with validation
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    const validation = validateSearchQuery(query);

    if (!validation.isValid) {
      console.warn('Search validation failed:', validation.error);
    }

    setSearchQuery(query);
  }, [validateSearchQuery]);

  /**
   * Handle search submission
   * Validates query and triggers search
   */
  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const validation = validateSearchQuery(searchQuery);
      if (!validation.isValid) {
        console.error('Invalid search query:', validation.error);
        return;
      }

      if (searchQuery.trim()) {
        console.log('Searching for:', searchQuery);
        // TODO: Implement actual search functionality
      }
    },
    [searchQuery, validateSearchQuery]
  );

  /**
   * Handle profile menu item click with validation
   * @param {string} action - Action to perform
   */
  const handleProfileMenuClick = useCallback(
    (action) => {
      if (!action || typeof action !== 'string') {
        console.error('Invalid action:', action);
        return;
      }

      if (!validateUserData(user)) {
        console.error('Invalid user data');
        return;
      }

      try {
        onProfileClick(action);
        setShowProfileMenu(false);
      } catch (error) {
        console.error('Profile action error:', error);
      }
    },
    [user, onProfileClick, validateUserData]
  );

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = useCallback(() => {
    try {
      markAllAsRead();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [markAllAsRead]);

  // ============================================================================
  // FORMATTED DATA
  // ============================================================================

  /**
   * Get formatted current time
   * Format: HH:MM AM/PM
   */
  const formattedTime = useMemo(
    () =>
      currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    [currentTime]
  );

  /**
   * Get current date
   * Format: Month Day, Year
   */
  const formattedDate = useMemo(
    () =>
      currentTime.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [currentTime]
  );

  /**
   * Get greeting based on time of day
   */
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  /**
   * Format user's display name with proper capitalization
   */
  const userDisplayName = useMemo(() => {
    // Capitalize first letter of a word
    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Prefer firstName + lastName
    if (user?.firstName) {
      const first = capitalize(user.firstName);
      const last = user?.lastName ? capitalize(user.lastName) : '';
      return last ? `${first} ${last}` : first;
    }

    // If name exists, try to extract proper format
    if (user?.name) {
      const name = String(user.name).trim();
      
      // If name contains dots (email-like: satish.yalla), convert to readable name
      if (name.includes('.') && !name.includes('@')) {
        const parts = name.split('.');
        return parts.map(capitalize).join(' ');
      }

      // If name has spaces, capitalize each word
      if (name.includes(' ')) {
        return name.split(' ').map(capitalize).join(' ');
      }

      // Single word name
      return capitalize(name);
    }

    return 'User';
  }, [user?.firstName, user?.lastName, user?.name]);

  const roleLabel = useMemo(() => {
    const normalized = String(user.role || '').replace(/_/g, ' ').trim();
    if (!normalized) {
      return 'User';
    }

    return normalized
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, [user.role]);

  const notificationItems = useMemo(() => {
    return notifications.slice(0, 3).map((notif) => ({
      id: notif.id,
      title: notif.message || notif.title,
      time: notif.timeAgo || 'Just now',
      read: notif.read,
    }));
  }, [notifications]);

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <header className="sticky top-0 z-40 bg-white/90 border-b border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 gap-4">
        {/* ========================================
            LEFT SECTION - SEARCH
            ======================================== */}
        <div className="flex-1 flex items-center gap-4">
          {/* Search Form - Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md">
            <div className="relative group w-full">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-700 group-focus-within:text-blue-700 transition-colors duration-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search people, requests, payroll, or policies..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-400 text-slate-900 placeholder-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 shadow-lg font-medium"
                aria-label="Search HR system"
                maxLength={VALIDATION_RULES.SEARCH_MAX_LENGTH}
              />
            </div>
          </form>

          {/* Greeting Text - Mobile */}
          <div className="md:hidden">
            <p className="text-sm font-semibold text-slate-800">{greeting}, {userDisplayName}!</p>
            <p className="text-xs text-slate-600">{formattedDate}</p>
          </div>

          {/* Greeting Text - Desktop */}
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-800">
              {greeting}, {userDisplayName}!
            </p>
          </div>
        </div>

        {/* ========================================
            RIGHT SECTION - NOTIFICATIONS & PROFILE
            ======================================== */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Current Time - Desktop Only */}
          <div
            className="hidden lg:flex flex-col items-end text-slate-700"
            title={formattedDate}
          >
            <p className="text-sm font-semibold">{formattedTime}</p>
            <p className="text-xs text-slate-600">{formattedDate}</p>
          </div>

          {/* Punch In / Out Button */}
          {canPunch && (
            punchStatus === 'in' ? (
              <button
                onClick={handlePunchOut}
                disabled={punchLoading}
                title={`Location: ${punchLocationLabel}`}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all duration-200 shadow-md disabled:opacity-60"
              >
                <FiLogIn size={15} className="rotate-180" />
                {punchLoading ? 'Recording…' : 'Punch Out'}
              </button>
            ) : (
              <button
                onClick={handlePunchIn}
                disabled={punchLoading}
                title={`Location: ${punchLocationLabel}`}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all duration-200 shadow-md disabled:opacity-60"
              >
                <FiLogIn size={15} />
                {punchLoading ? 'Recording…' : 'Punch In'}
              </button>
            )
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              data-menu-trigger="notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-white/30 rounded-lg transition-all duration-300"
              aria-label={`Notifications (${unreadCount} unread)`}
              title={`${unreadCount} new notifications`}
            >
              <FiBell size={20} />

              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span
                  className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse"
                  aria-label={`${unreadCount} new notifications`}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 top-full"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-800 font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {unreadCount > 0 ? (
                    <div className="space-y-3">
                      {notificationItems.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-100/80 rounded-lg hover:bg-slate-200/80 transition-colors cursor-pointer border border-slate-200">
                          <p className="text-sm text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{item.time}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center text-sm">No new notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              data-menu-trigger="profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/30 rounded-lg transition-all duration-300"
              aria-label="User profile menu"
              aria-expanded={showProfileMenu}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-lg"
                title={user.name}
              >
                {user.avatar || user.name?.charAt(0) || 'U'}
              </div>

              {/* Dropdown Arrow */}
              <FiChevronDown
                size={18}
                className={`text-slate-700 transition-transform duration-300 hidden md:block ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 top-full"
                role="menu"
                aria-label="Profile menu"
              >
                {/* User Info */}
                <div className="p-4 border-b border-slate-200">
                  <p className="text-slate-800 font-semibold">{user.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => handleProfileMenuClick('profile')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-300"
                    role="menuitem"
                  >
                    <FiUser size={18} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => handleProfileMenuClick('settings')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-300"
                    role="menuitem"
                  >
                    <FiSettings size={18} />
                    <span>Workspace Settings</span>
                  </button>

                  <div className="border-t border-slate-200 my-2" />

                  <button
                    onClick={() => handleProfileMenuClick('logout')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300"
                    role="menuitem"
                  >
                    <FiLogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// PROP VALIDATION
// ============================================================================
HRHeader.propTypes = {};

// ============================================================================
// EXPORTS
// ============================================================================
export default HRHeader;
export { VALIDATION_RULES };
