import { hasPermission } from "../config/permissions.js";

/**
 * Permission Guard Middleware
 * Checks if user has permission for a specific resource and action
 * 
 * Usage in routes:
 * router.post('/employees', authGuard, permissionGuard('employees', 'create'), controller)
 */
const permissionGuard = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    const userRole = req.user.role;

    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied - ${userRole} cannot perform ${action} on ${resource}`,
      });
    }

    next();
  };
};

/**
 * Multiple Permission Guard
 * Checks if user has ANY of the specified permissions
 * 
 * Usage:
 * router.get('/data', authGuard, multiPermissionGuard([
 *   { resource: 'employees', action: 'read' },
 *   { resource: 'reports', action: 'view' }
 * ]), controller)
 */
const multiPermissionGuard = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    const userRole = req.user.role;

    const hasAny = permissions.some((perm) =>
      hasPermission(userRole, perm.resource, perm.action)
    );

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: "Access Denied - Insufficient permissions",
      });
    }

    next();
  };
};

/**
 * Resource Owner Guard
 * Ensures user can only access their own resources
 * 
 * Usage:
 * router.get('/employees/:employeeId', authGuard, resourceOwnerGuard, controller)
 * Assumes req.params.employeeId matches req.user.id for employees
 */
const resourceOwnerGuard = (resourceField = "employeeId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    const resourceId = req.params[resourceField];
    const userId = req.user.id;

    if (req.user.role !== "SUPER_ADMIN" && req.user.role !== "HR_ADMIN") {
      if (resourceId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access Denied - You can only access your own resources",
        });
      }
    }

    next();
  };
};

/**
 * Action-based Permission Guard
 * Flexible permission checking with custom logic
 * 
 * Usage:
 * router.post('/employees', authGuard, actionGuard(req => {
 *   return hasPermission(req.user.role, 'employees', 'create');
 * }), controller)
 */
const actionGuard = (permissionCheck) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    if (!permissionCheck(req)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied - Insufficient permissions",
      });
    }

    next();
  };
};

export {
  permissionGuard,
  multiPermissionGuard,
  resourceOwnerGuard,
  actionGuard,
};
