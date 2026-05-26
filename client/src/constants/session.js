/** Client session / idle timeout configuration */

export const IDLE_SESSION_MINUTES = 15;
export const IDLE_WARNING_MINUTES = 2;

export const IDLE_SESSION_MS = IDLE_SESSION_MINUTES * 60 * 1000;
export const IDLE_WARNING_MS = IDLE_WARNING_MINUTES * 60 * 1000;

export const LOGOUT_REASON_KEY = 'hrms_logout_reason';
export const LOGOUT_REASON_IDLE = 'idle';
