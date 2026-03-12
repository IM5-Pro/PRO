import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';

const ManagerHeader = ({
  user = { name: 'Sourav', email: 'sourav@example.com', avatar: '👨‍💼', role: 'manager' },
  onProfileClick = () => {},
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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

  const formattedTime = useMemo(
    () =>
      currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    [currentTime]
  );

  const formattedDate = useMemo(
    () =>
      currentTime.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [currentTime]
  );

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  return (
    <header className="sticky top-0 z-40 bg-white/15 backdrop-blur-xl border-b border-white/40 shadow-md will-change-transform">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 gap-4">
        <div className="flex-1 flex items-center gap-4">
          <form onSubmit={(e) => e.preventDefault()} className="hidden md:flex flex-1 max-w-md">
            <div className="relative group w-full">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-700 group-focus-within:text-blue-700 transition-colors duration-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search team, leaves, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-400 text-slate-900 placeholder-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 shadow-lg font-medium"
                aria-label="Search manager dashboard"
                maxLength={100}
              />
            </div>
          </form>

          <div className="md:hidden">
            <p className="text-sm font-semibold text-slate-800">{greeting}, {user.name?.split(' ')[0]}!</p>
            <p className="text-xs text-slate-600">{formattedDate}</p>
          </div>

          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-800">
              {greeting}, {user.name}!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden lg:flex flex-col items-end text-slate-700" title={formattedDate}>
            <p className="text-sm font-semibold">{formattedTime}</p>
            <p className="text-xs text-slate-600">{formattedDate}</p>
          </div>

          <div className="relative">
            <button
              data-menu-trigger="notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-white/30 rounded-lg transition-all duration-300"
              aria-label="Notifications"
              title="1 new notification"
            >
              <FiBell size={20} />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                1
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-2xl z-50 top-full" role="dialog" aria-label="Notifications">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-slate-800 font-semibold">Notifications</h3>
                </div>
                <div className="p-4">
                  <div className="p-3 bg-slate-100/80 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-800">You have pending approvals to review.</p>
                    <p className="text-xs text-slate-600 mt-1">Just now</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              data-menu-trigger="profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/30 rounded-lg transition-all duration-300"
              aria-label="User profile menu"
              aria-expanded={showProfileMenu}
            >
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-lg"
                title={user.name}
              >
                {user.avatar || user.name?.charAt(0) || 'U'}
              </div>

              <FiChevronDown
                size={18}
                className={`text-slate-700 transition-transform duration-300 hidden md:block ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-2xl z-50 top-full" role="menu" aria-label="Profile menu">
                <div className="p-4 border-b border-slate-200">
                  <p className="text-slate-800 font-semibold">{user.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                      Manager
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      onProfileClick('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-300"
                    role="menuitem"
                  >
                    <FiUser size={18} />
                    <span>View Profile</span>
                  </button>

                  <div className="border-t border-slate-200 my-2" />

                  <button
                    onClick={() => {
                      onProfileClick('logout');
                      setShowProfileMenu(false);
                    }}
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

export default ManagerHeader;
