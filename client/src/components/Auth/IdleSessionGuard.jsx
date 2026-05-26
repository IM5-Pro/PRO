import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiClock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useIdleSession } from '../../hooks/useIdleSession';
import {
  IDLE_SESSION_MINUTES,
  LOGOUT_REASON_IDLE,
  LOGOUT_REASON_KEY,
} from '../../constants/session';

const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  return `${seconds}s`;
};

const IdleSessionGuard = () => {
  const { isAuthenticated, loading, logout } = useAuth();

  const handleIdleLogout = useCallback(async () => {
    try {
      sessionStorage.setItem(LOGOUT_REASON_KEY, LOGOUT_REASON_IDLE);
    } catch {
      // ignore storage errors
    }
    await logout();
  }, [logout]);

  const { showWarning, staySignedIn, secondsRemaining } = useIdleSession({
    enabled: isAuthenticated && !loading,
    onIdle: handleIdleLogout,
  });

  if (!showWarning) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-session-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:text-gray-100">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <FiClock className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 id="idle-session-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Session expiring soon
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No activity for {IDLE_SESSION_MINUTES} minutes. You will be signed out in{' '}
              <strong>{formatCountdown(secondsRemaining)}</strong>.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={handleIdleLogout}
          >
            Sign out now
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={staySignedIn}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default IdleSessionGuard;
