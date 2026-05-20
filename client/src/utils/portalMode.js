import { normalizeRole, ROLES } from './roles';

export const PORTAL_MODES = Object.freeze({
  WORK: 'work',
  OPERATIONS: 'operations',
});

const STORAGE_PREFIX = 'hrms_portal_mode_';

export const PORTAL_SWITCHABLE_ROLES = new Set([
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.DEPT_ADMIN,
]);

export const canSwitchPortal = (role) => PORTAL_SWITCHABLE_ROLES.has(normalizeRole(role));

export const isWorkPortalMode = (role, portalMode) =>
  canSwitchPortal(role) && portalMode === PORTAL_MODES.WORK;

export const getOperationsPortalLabel = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === ROLES.MANAGER) {
    return 'Team operations';
  }
  if (normalized === ROLES.HR_ADMIN) {
    return 'HR operations';
  }
  if (normalized === ROLES.DEPT_ADMIN) {
    return 'Department admin';
  }
  return 'Operations';
};

export const getWorkPortalLabel = () => 'My work';

export const getPortalModeOptions = (role) => {
  if (!canSwitchPortal(role)) {
    return [];
  }

  return [
    { id: PORTAL_MODES.WORK, label: getWorkPortalLabel() },
    { id: PORTAL_MODES.OPERATIONS, label: getOperationsPortalLabel(role) },
  ];
};

const storageKey = (role) => `${STORAGE_PREFIX}${normalizeRole(role)}`;

export const readStoredPortalMode = (role) => {
  if (!canSwitchPortal(role)) {
    return null;
  }

  try {
    const stored = localStorage.getItem(storageKey(role));
    if (stored === PORTAL_MODES.WORK || stored === PORTAL_MODES.OPERATIONS) {
      return stored;
    }
  } catch {
    // ignore storage errors
  }

  return PORTAL_MODES.OPERATIONS;
};

export const persistPortalMode = (role, mode) => {
  if (!canSwitchPortal(role)) {
    return;
  }

  try {
    localStorage.setItem(storageKey(role), mode);
  } catch {
    // ignore storage errors
  }
};

export const parsePortalModeFromSearch = (searchParams) => {
  const raw = String(searchParams?.get('portal') || '').trim().toLowerCase();
  if (raw === PORTAL_MODES.WORK || raw === 'my-work' || raw === 'employee') {
    return PORTAL_MODES.WORK;
  }
  if (raw === PORTAL_MODES.OPERATIONS || raw === 'ops' || raw === 'operations') {
    return PORTAL_MODES.OPERATIONS;
  }
  return null;
};

export const resolveInitialPortalMode = (role, searchParams) => {
  if (!canSwitchPortal(role)) {
    return PORTAL_MODES.OPERATIONS;
  }

  return parsePortalModeFromSearch(searchParams) || readStoredPortalMode(role);
};

/** Active portal: URL wins; otherwise persisted preference (operations if unset). */
export const resolveActivePortalMode = (role, searchParams) => {
  if (!canSwitchPortal(role)) {
    return PORTAL_MODES.OPERATIONS;
  }

  const fromUrl = parsePortalModeFromSearch(searchParams);
  if (fromUrl) {
    return fromUrl;
  }

  return readStoredPortalMode(role);
};
