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

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut, FiSettings, FiLogIn } from 'react-icons/fi';
import { usePunch } from '../../context/PunchContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationsPanel from '../Notifications/NotificationsPanel';
import {
  runHeaderSearch,
  runHeaderSearchLocal,
  SEARCH_MIN_LENGTH,
} from '../../services/headerSearch';

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
  onNavigate = () => {},
  portalPages = [],
  showPortalSwitcher = false,
  portalMode = 'operations',
  portalModeOptions = [],
  onPortalModeChange = () => {},
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(0);
  const [searchDropdownRect, setSearchDropdownRect] = useState(null);
  const searchContainerRef = useRef(null);
  const searchRequestRef = useRef(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Punch state from shared context
  const { canPunch, punchStatus, loading: punchLoading, locationLabel: punchLocationLabel, punchIn: handlePunchIn, punchOut: handlePunchOut } = usePunch();

  // Notification state and actions from context
  const { unreadCount, notifications } = useNotifications();

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
      const profileTrigger = document.querySelector('[data-menu-trigger="profile"]');
      const isProfileClick =
        profileTrigger?.contains(e.target) || e.target.closest('[data-menu-trigger="profile"]');
      const isSearchClick = searchContainerRef.current?.contains(e.target);

      if (!isProfileClick && showProfileMenu) {
        setShowProfileMenu(false);
      }

      if (!isSearchClick && searchOpen) {
        setSearchOpen(false);
      }
    };

    if (showProfileMenu || searchOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProfileMenu, searchOpen]);

  useEffect(() => {
    if (!searchOpen || !searchContainerRef.current) {
      setSearchDropdownRect(null);
      return undefined;
    }

    const updateRect = () => {
      if (!searchContainerRef.current) {
        return;
      }
      const rect = searchContainerRef.current.getBoundingClientRect();
      setSearchDropdownRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [searchOpen, searchQuery]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchOpen(false);
      setSearchHighlight(0);
      return undefined;
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    const local = runHeaderSearchLocal({
      query: trimmed,
      portalPages,
      notifications,
    });
    setSearchResults(local.all);
    setSearchOpen(true);
    setSearchHighlight(0);

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const remote = await runHeaderSearch({
          query: trimmed,
          portalPages,
          notifications,
          userRole: user.role,
        });
        if (searchRequestRef.current === requestId) {
          setSearchResults(remote.all);
        }
      } finally {
        if (searchRequestRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, portalPages, notifications, user.role]);

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

  const handleSearchSelect = useCallback(
    (result) => {
      if (!result?.pageId) {
        return;
      }

      onNavigate(result.pageId, {
        employeeId: result.employeeId,
      });
      setSearchQuery('');
      setSearchResults([]);
      setSearchOpen(false);
      setSearchHighlight(0);
    },
    [onNavigate],
  );

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const validation = validateSearchQuery(searchQuery);
      if (!validation.isValid) {
        return;
      }

      if (searchResults.length > 0) {
        handleSearchSelect(searchResults[searchHighlight] || searchResults[0]);
      }
    },
    [searchQuery, validateSearchQuery, searchResults, searchHighlight, handleSearchSelect],
  );

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (!searchOpen || searchResults.length === 0) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSearchHighlight((prev) => (prev + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSearchHighlight((prev) => (prev - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    },
    [searchOpen, searchResults.length],
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

  const portalSwitcher = showPortalSwitcher && portalModeOptions.length > 0 && (
    <div
      className="inline-flex w-full max-w-full shrink-0 items-stretch rounded-xl border border-im5-border-soft bg-im5-subtle p-0.5 sm:w-auto"
      role="tablist"
      aria-label="Portal mode"
    >
      {portalModeOptions.map((option) => {
        const isActive = portalMode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onPortalModeChange(option.id)}
            className={`min-w-0 flex-1 rounded-lg px-2.5 py-2 text-center text-[11px] font-semibold leading-tight transition-colors sm:flex-none sm:px-3 sm:text-xs ${
              isActive
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="block truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  const searchDropdown =
    searchOpen &&
    searchDropdownRect &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        id="hr-header-search-listbox"
        className="fixed z-[200] max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        style={{
          top: searchDropdownRect.top,
          left: searchDropdownRect.left,
          width: searchDropdownRect.width,
        }}
        role="listbox"
      >
        {searchLoading && searchResults.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
        ) : searchResults.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">No matches found</p>
        ) : (
          searchResults.map((result, index) => (
            <button
              key={result.id}
              type="button"
              role="option"
              aria-selected={index === searchHighlight}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSearchSelect(result)}
              className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                index === searchHighlight ? 'bg-blue-50 text-blue-900' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="mt-0.5 shrink-0 text-base" aria-hidden>
                {result.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{result.title}</span>
                {result.subtitle ? (
                  <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>,
      document.body,
    );

  const searchForm = (
    <form
      onSubmit={handleSearchSubmit}
      className={`hidden min-w-0 ${
        portalSwitcher
          ? 'lg:flex lg:flex-1 lg:max-w-sm xl:max-w-md'
          : 'md:flex md:flex-1 md:max-w-md'
      }`}
    >
      <div ref={searchContainerRef} className="relative group w-full">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-700 transition-colors duration-300"
          size={18}
        />
        <input
          type="text"
          role="combobox"
          placeholder="Search people, pages, notifications..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchQuery.trim().length >= SEARCH_MIN_LENGTH) {
              setSearchOpen(true);
            }
          }}
          onKeyDown={handleSearchKeyDown}
          className={`w-full rounded-xl border-2 border-slate-400 bg-white pl-10 pr-4 text-slate-900 shadow-lg placeholder-slate-700 transition-all duration-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            portalSwitcher
              ? 'py-2.5 text-sm font-medium'
              : 'py-3 font-medium'
          }`}
          aria-label="Search HR system"
          aria-expanded={searchOpen}
          aria-controls="hr-header-search-listbox"
          aria-autocomplete="list"
          maxLength={VALIDATION_RULES.SEARCH_MAX_LENGTH}
        />
        {searchDropdown}
      </div>
    </form>
  );

  const headerLeft = portalSwitcher ? (
    <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
      {searchForm}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {greeting}, {userDisplayName}!
        </p>
      </div>
    </div>
  ) : (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {searchForm}
      <div className="min-w-0 md:hidden">
        <p className="text-sm font-semibold text-slate-800">
          {greeting}, {userDisplayName}!
        </p>
        <p className="text-xs text-slate-600">{formattedDate}</p>
      </div>
      <div className="hidden min-w-0 md:block">
        <p className="truncate text-sm font-semibold text-slate-800">
          {greeting}, {userDisplayName}!
        </p>
      </div>
    </div>
  );

  const headerActions = (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-6">
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

            {/* NotificationsPanel Modal */}
            <NotificationsPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
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
  );

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-im5-border-soft bg-im5-header shadow-sm backdrop-blur-sm">
      <div
        className={`px-4 md:px-8 ${
          portalSwitcher
            ? 'flex flex-col gap-3 py-3 md:py-3'
            : 'flex items-center justify-between gap-4 py-4'
        }`}
      >
        {portalSwitcher ? (
          <>
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              {headerLeft}
              {headerActions}
            </div>
            <div className="w-full min-w-0 border-t border-im5-border-soft pt-3 md:pt-2.5">
              {portalSwitcher}
            </div>
          </>
        ) : (
          <>
            {headerLeft}
            {headerActions}
          </>
        )}
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
