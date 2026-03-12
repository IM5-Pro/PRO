/**
 * Role-Based Permission Configuration
 * Defines what actions each role can perform
 * Reusable across the application for authorization checks
 */

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    // User Management
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      export: true,
      import: true,
      bulk_update: true,
    },

    // Employee Management
    employees: {
      create: true,
      read: true,
      update: true,
      delete: true,
      deactivate: true,
      activate: true,
      view_profile: true,
      update_profile: true,
      upload_docs: true,
      download_docs: true,
      view_salary: true,
      transfer_dept: true,
      change_designation: true,
      change_manager: true,
      list: true,
      export: true,
      import: true,
      bulk_update: true,
      view_history: true,
    },

    // Role Management
    roles: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      view_permissions: true,
      assign_permissions: true,
      remove_permissions: true,
    },

    // Permission Management
    permissions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      assign_role: true,
      remove_role: true,
    },

    // Attendance
    attendance: {
      checkin: true,
      checkout: true,
      view_own: true,
      view_team: true,
      view_all: true,
      edit: true,
      delete: true,
      bulk_upload: true,
      export: true,
      approve: true,
      reject: true,
      shift_assign: true,
      shift_update: true,
      shift_delete: true,
    },

    // Leave Management
    leaves: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      approve: true,
      reject: true,
      cancel: true,
      export: true,
    },

    // Reports
    reports: {
      view: true,
      export: true,
      generate: true,
    },

    // Audit Logs
    audit_logs: {
      view: true,
      export: true,
    },

    // Payroll
    payroll: {
      create: true,
      process: true,
      approve: true,
      reject: true,
      generate_slips: true,
      view_own: true,
      view_all: true,
      download_slip: true,
      export: true,
      update_salary: true,
      view_salary_structure: true,
      update_salary_structure: true,
      tax_calculate: true,
      tax_update: true,
      bonus_add: true,
      deduction_add: true,
      lock: true,
      unlock: true,
    },

    // Designation Management
    designation: {
      create: true,
      read: true,
      update: true,
      delete: true,
      list: true,
      assign: true,
    },
  },

  HR_ADMIN: {
    // User Management (limited)
    users: {
      create: true,
      read: true,
      update: false, // Cannot update user roles/permissions
      delete: false, // Cannot delete users
      list: true,
      export: true,
      import: true,
      bulk_update: true,
    },

    // Employee Management (full)
    employees: {
      create: true,
      read: true,
      update: true,
      delete: false, // Use deactivate instead
      deactivate: true,
      activate: true,
      view_profile: true,
      update_profile: false, // Only employees can update their own
      upload_docs: true,
      download_docs: true,
      view_salary: true,
      transfer_dept: true,
      change_designation: true,
      change_manager: true,
      list: true,
      export: true,
      import: true,
      bulk_update: true,
      view_history: true,
    },

    // Role Management (view only)
    roles: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
      view_permissions: true,
      assign_permissions: false,
      remove_permissions: false,
    },

    // Permission Management (view only)
    permissions: {
      create: false,
      read: true,
      update: false,
      delete: false,
      list: true,
      assign_role: false,
      remove_role: false,
    },

    // Attendance
    attendance: {
      checkin: false, // Self-service only, cannot record for others
      checkout: false, // Self-service only, cannot record for others
      view_own: true,
      view_team: true,
      view_all: true,
      edit: true, // Can correct mistakes
      delete: false, // Cannot hard delete
      bulk_upload: true,
      export: true,
      approve: true,
      reject: true,
      shift_assign: true,
      shift_update: true,
      shift_delete: true,
    },

    // Leave Management
    leaves: {
      create: true,
      read: true,
      update: true,
      delete: false,
      list: true,
      approve: true,
      reject: true,
      cancel: false,
      export: true,
    },

    // Reports
    reports: {
      view: true,
      export: true,
      generate: false,
    },

    // Audit Logs
    audit_logs: {
      view: false, // Cannot view audit logs
      export: false,
    },

    // Payroll
    payroll: {
      create: true,
      process: true,
      approve: true,
      reject: true,
      generate_slips: true,
      view_own: true,
      view_all: true,
      download_slip: true,
      export: true,
      update_salary: true,
      view_salary_structure: true,
      update_salary_structure: true,
      tax_calculate: true,
      tax_update: true,
      bonus_add: true,
      deduction_add: true,
      lock: true,
      unlock: true,
    },

    // Designation Management
    designation: {
      create: true,
      read: true,
      update: true,
      delete: false, // Cannot delete
      list: true,
      assign: true,
    },
  },

  MANAGER: {
    // User Management (no access)
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      export: false,
      import: false,
      bulk_update: false,
    },

    // Employee Management (team only)
    employees: {
      create: false,
      read: true, // Only team members
      update: false,
      delete: false,
      deactivate: false,
      activate: false,
      view_profile: true, // Only team members
      update_profile: false,
      upload_docs: false,
      download_docs: false,
      view_salary: true, // Only team members
      transfer_dept: false,
      change_designation: false,
      change_manager: false,
      list: true, // Only their team
      export: false,
      import: false,
      bulk_update: false,
      view_history: true, // Only team members
    },

    // Role Management (no access)
    roles: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      view_permissions: false,
      assign_permissions: false,
      remove_permissions: false,
    },

    // Permission Management (no access)
    permissions: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      assign_role: false,
      remove_role: false,
    },

    // Attendance
    attendance: {
      checkin: false,
      checkout: false,
      view_own: true, // Can view their own records
      view_team: true, // Can view team records
      view_all: false,
      edit: false,
      delete: false,
      bulk_upload: false,
      export: false,
      approve: true, // Can approve team's attendance
      reject: true, // Can reject team's attendance
      shift_assign: false,
      shift_update: false,
      shift_delete: false,
    },

    // Leave Management
    leaves: {
      create: true, // Apply leave
      read: true, // View own and team
      update: true, // Update own pending
      delete: false,
      list: true, // Team only
      approve: true, // Approve team leaves
      reject: true,
      cancel: false,
      export: false,
    },

    // Reports
    reports: {
      view: true, // Team reports only
      export: false,
      generate: false,
    },

    // Audit Logs
    audit_logs: {
      view: false,
      export: false,
    },

    // Payroll
    payroll: {
      create: false,
      process: false,
      approve: false,
      reject: false,
      generate_slips: false,
      view_own: false,
      view_all: false,
      download_slip: false,
      export: false,
      update_salary: false,
      view_salary_structure: false,
      update_salary_structure: false,
      tax_calculate: false,
      tax_update: false,
      bonus_add: false,
      deduction_add: false,
      lock: false,
      unlock: false,
    },

    // Designation Management
    designation: {
      create: false,
      read: true, // Can view designations
      update: false,
      delete: false,
      list: true, // Can list designations
      assign: false,
    },
  },

  EMPLOYEE: {
    // User Management (no access)
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      export: false,
      import: false,
      bulk_update: false,
    },

    // Employee Management (self only)
    employees: {
      create: false,
      read: true, // Own record only
      update: false,
      delete: false,
      deactivate: false,
      activate: false,
      view_profile: true, // Own profile
      update_profile: true, // Can update own basic info
      upload_docs: true, // Can upload own documents
      download_docs: true, // Can download own documents
      view_salary: true, // Own salary only
      transfer_dept: false,
      change_designation: false,
      change_manager: false,
      list: false,
      export: false,
      import: false,
      bulk_update: false,
      view_history: true, // Own history only
    },

    // Role Management (no access)
    roles: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      view_permissions: false,
      assign_permissions: false,
      remove_permissions: false,
    },

    // Permission Management (no access)
    permissions: {
      create: false,
      read: false,
      update: false,
      delete: false,
      list: false,
      assign_role: false,
      remove_role: false,
    },

    // Attendance
    attendance: {
      checkin: true, // Can check-in themselves
      checkout: true, // Can check-out themselves
      view_own: true, // Can view their own records
      view_team: false,
      view_all: false,
      edit: false,
      delete: false,
      bulk_upload: false,
      export: false,
      approve: false,
      reject: false,
      shift_assign: false,
      shift_update: false,
      shift_delete: false,
    },

    // Leave Management
    leaves: {
      create: true, // Apply own leave
      read: true, // View own leaves
      update: true, // Update own pending leaves
      delete: false,
      list: false,
      approve: false,
      reject: false,
      cancel: true, // Cancel own pending leave
      export: false,
    },

    // Reports
    reports: {
      view: false,
      export: false,
      generate: false,
    },

    // Audit Logs
    audit_logs: {
      view: false,
      export: false,
    },

    // Payroll
    payroll: {
      create: false,
      process: false,
      approve: false,
      reject: false,
      generate_slips: false,
      view_own: true,
      view_all: false,
      download_slip: true,
      export: false,
      update_salary: false,
      view_salary_structure: false,
      update_salary_structure: false,
      tax_calculate: false,
      tax_update: false,
      bonus_add: false,
      deduction_add: false,
      lock: false,
      unlock: false,
    },

    // Designation Management
    designation: {
      create: false,
      read: true, // Can view own designation
      update: false,
      delete: false,
      list: false,
      assign: false,
    },
  },

  FINANCE: {
    users: {},
    employees: {},
    roles: {},
    permissions: {},
    attendance: {},
    leaves: {},
    reports: {
      view: true,
      export: true,
      generate: false,
    },
    audit_logs: {
      view: false,
      export: false,
    },
    designation: {},
    payroll: {
      create: false,
      process: false,
      approve: true,
      reject: true,
      generate_slips: false,
      view_own: true,
      view_all: true,
      download_slip: true,
      export: true,
      update_salary: false,
      view_salary_structure: false,
      update_salary_structure: false,
      tax_calculate: true,
      tax_update: false,
      bonus_add: false,
      deduction_add: false,
      lock: false,
      unlock: false,
    },
  },
};

/**
 * Check if a role has permission for an action
 * @param {string} role - User role (SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE)
 * @param {string} resource - Resource type (users, employees, roles, etc.)
 * @param {string} action - Action (create, read, update, delete, etc.)
 * @returns {boolean} - True if permission exists, false otherwise
 */
const hasPermission = (role, resource, action) => {
  // SUPER_ADMIN and HR_ADMIN are considered unrestricted; they bypass the
  // permission table and always return true for any resource/action. This
  // simplifies controller logic since both roles should be able to do all
  // operations in the API.
  if (role === "SUPER_ADMIN" || role === "HR_ADMIN") {
    return true;
  }

  const rolePermissions = ROLE_PERMISSIONS[role];

  if (!rolePermissions) {
    return false;
  }

  if (!rolePermissions[resource]) {
    return false;
  }

  return rolePermissions[resource][action] === true;
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {object} - All permissions for the role
 */
const getPermissions = (role) => {
  // Return a copy of the permissions object; super and hr admins receive the
  // full SUPER_ADMIN permission set regardless of what is defined for them.
  if (role === "SUPER_ADMIN" || role === "HR_ADMIN") {
    return { ...ROLE_PERMISSIONS.SUPER_ADMIN };
  }

  return ROLE_PERMISSIONS[role] || {};
};

/**
 * Get permissions for a specific resource
 * @param {string} role - User role
 * @param {string} resource - Resource type
 * @returns {object} - Permissions for the resource
 */
const getResourcePermissions = (role, resource) => {
  if (role === "SUPER_ADMIN" || role === "HR_ADMIN") {
    return ROLE_PERMISSIONS.SUPER_ADMIN[resource] || {};
  }

  return ROLE_PERMISSIONS[role]?.[resource] || {};
};

/**
 * Check if role has read access to resource
 * @param {string} role - User role
 * @param {string} resource - Resource type
 * @returns {boolean}
 */
const canRead = (role, resource) => {
  return hasPermission(role, resource, "read");
};

/**
 * Check if role has create access to resource
 * @param {string} role - User role
 * @param {string} resource - Resource type
 * @returns {boolean}
 */
const canCreate = (role, resource) => {
  return hasPermission(role, resource, "create");
};

/**
 * Check if role has update access to resource
 * @param {string} role - User role
 * @param {string} resource - Resource type
 * @returns {boolean}
 */
const canUpdate = (role, resource) => {
  return hasPermission(role, resource, "update");
};

/**
 * Check if role has delete access to resource
 * @param {string} role - User role
 * @param {string} resource - Resource type
 * @returns {boolean}
 */
const canDelete = (role, resource) => {
  return hasPermission(role, resource, "delete");
};

export {
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissions,
  getResourcePermissions,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
};
