import { useCallback, useEffect, useRef, useState } from 'react';
import { IDLE_SESSION_MS, IDLE_WARNING_MS } from '../constants/session';

const THROTTLE_MS = 1000;
const CHECK_INTERVAL_MS = 10000;

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

/**
 * Signs the user out after `IDLE_SESSION_MS` with no user activity.
 * Shows a warning in the final `IDLE_WARNING_MS` window.
 */
export function useIdleSession({ enabled, onIdle }) {
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);
  const onIdleRef = useRef(onIdle);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.ceil(IDLE_WARNING_MS / 1000),
  );

  onIdleRef.current = onIdle;

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsRemaining(Math.ceil(IDLE_WARNING_MS / 1000));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setShowWarning(false);
      loggingOutRef.current = false;
      return undefined;
    }

    lastActivityRef.current = Date.now();
    loggingOutRef.current = false;
    setShowWarning(false);

    let throttleUntil = 0;

    const onActivity = () => {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + THROTTLE_MS;
      resetActivity();
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true });
    });

    const checkIdle = () => {
      const idleFor = Date.now() - lastActivityRef.current;

      if (idleFor >= IDLE_SESSION_MS) {
        if (!loggingOutRef.current) {
          loggingOutRef.current = true;
          setShowWarning(false);
          onIdleRef.current?.();
        }
        return;
      }

      const warnThreshold = IDLE_SESSION_MS - IDLE_WARNING_MS;
      if (idleFor >= warnThreshold) {
        const remainingMs = IDLE_SESSION_MS - idleFor;
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
        setShowWarning(true);
      } else {
        setShowWarning(false);
        setSecondsRemaining(Math.ceil(IDLE_WARNING_MS / 1000));
      }
    };

    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);
    checkIdle();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, onActivity);
      });
      window.clearInterval(intervalId);
    };
  }, [enabled, resetActivity]);

  useEffect(() => {
    if (!enabled || !showWarning) {
      return undefined;
    }

    const tick = () => {
      const idleFor = Date.now() - lastActivityRef.current;
      const remainingMs = IDLE_SESSION_MS - idleFor;
      setSecondsRemaining(Math.max(0, Math.ceil(remainingMs / 1000)));
    };

    tick();
    const tickId = window.setInterval(tick, 1000);
    return () => window.clearInterval(tickId);
  }, [enabled, showWarning]);

  return { showWarning, staySignedIn: resetActivity, secondsRemaining };
}
