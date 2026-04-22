import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import { validateRole, validatePermissionAssignment } from "../utils/roleValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";

/**
 * List all roles
 */
const listRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).populate("permissions");

    sendSuccess(res, 200, "Roles retrieved successfully", { roles, count: roles.length });
  } catch (err) {
    console.error("List roles error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Get single role by ID with permissions
 */
const readRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { roleId: "Role ID is required" });
    }

    const role = await Role.findById(roleId).populate("permissions");

    if (!role) {
      return sendError(res, 404, "Role not found");
    }

    sendSuccess(res, 200, "Role retrieved successfully", role);
  } catch (err) {
    console.error("Read role error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Create a new role
 */
const createRole = async (req, res) => {
  try {
    const validation = validateRole(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { name, description } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return sendError(res, 409, "Role already exists", { name: `Role "${name}" already exists` });
    }

    const role = await Role.create({
      name,
      description: description || "",
      permissions: [],
    });

    sendSuccess(res, 201, "Role created successfully", role);
  } catch (err) {
    console.error("Create role error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Update a role
 */
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { roleId: "Role ID is required" });
    }

    const validation = validateRole(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return sendError(res, 404, "Role not found");
    }

    // Check if new name is unique (if changing name)
    if (req.body.name && req.body.name !== role.name) {
      const existingRole = await Role.findOne({ name: req.body.name });
      if (existingRole) {
        return sendError(res, 409, "Role name already exists", { name: `Role "${req.body.name}" already exists` });
      }
    }
 
    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      {
        name: req.body.name || role.name,
        description: req.body.description !== undefined ? req.body.description : role.description,
      },
      { new: true }
    ).populate("permissions");

    sendSuccess(res, 200, "Role updated successfully", updatedRole);
  } catch (err) {
    console.error("Update role error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Delete a role
 */
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { roleId: "Role ID is required" });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return sendError(res, 404, "Role not found");
    }

    // Prevent deletion of system roles
    const systemRoles = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"];
    if (systemRoles.includes(role.name)) {
      return sendError(res, 403, `Cannot delete system role "${role.name}"`);
    }

    await Role.findByIdAndDelete(roleId);

    sendSuccess(res, 200, "Role deleted successfully", { id: roleId, name: role.name });
  } catch (err) {
    console.error("Delete role error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Assign permission to role
 */
const assignPermission = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    const validation = validatePermissionAssignment({ roleId, permissionId });
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const role = await Role.findById(roleId).populate("permissions");
    if (!role) {
      return sendError(res, 404, "Role not found");
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return sendError(res, 404, "Permission not found");
    }

    // Check if permission already assigned
    const isAssigned = role.permissions.some((p) => p._id.toString() === permissionId);
    if (isAssigned) {
      return sendError(res, 409, "Permission already assigned to this role");
    }

    role.permissions.push(permissionId);
    await role.save();
    await role.populate("permissions");

    sendSuccess(res, 200, "Permission assigned successfully", {
      role: role.name,
      permission: permission.name,
      totalPermissions: role.permissions.length,
    });
  } catch (err) {
    console.error("Assign permission error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Remove permission from role
 */
const removePermission = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    const validation = validatePermissionAssignment({ roleId, permissionId });
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const role = await Role.findById(roleId).populate("permissions");
    if (!role) {
      return sendError(res, 404, "Role not found");
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return sendError(res, 404, "Permission not found");
    }

    // Check if permission is assigned
    const isAssigned = role.permissions.some((p) => p._id.toString() === permissionId);
    if (!isAssigned) {
      return sendError(res, 404, "Permission not assigned to this role");
    }

    role.permissions = role.permissions.filter(
      (p) => p._id.toString() !== permissionId
    );
    await role.save();
    await role.populate("permissions");

    sendSuccess(res, 200, "Permission removed successfully", {
      role: role.name,
      permission: permission.name,
      totalPermissions: role.permissions.length,
    });
  } catch (err) {
    console.error("Remove permission error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * View permissions of a role
 */
const viewPermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { roleId: "Role ID is required" });
    }

    const role = await Role.findById(roleId).populate("permissions");

    if (!role) {
      return sendError(res, 404, "Role not found");
    }

    sendSuccess(res, 200, "Role permissions retrieved successfully", {
      roleId: role._id,
      roleName: role.name,
      roleDescription: role.description,
      permissions: role.permissions,
      totalPermissions: role.permissions.length,
    });
  } catch (err) {
    console.error("View permissions error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

export {
  listRoles,
  readRole,
  createRole,
  updateRole,
  deleteRole,
  assignPermission,
  removePermission,
  viewPermissions,
};
