import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import { validateRole, validatePermissionAssignment, validatePermission } from "../utils/roleValidators.js";

/**
 * List all roles
 */
const listRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).populate("permissions");

    res.status(200).json({
      success: true,
      message: "Roles retrieved successfully",
      data: roles,
      count: roles.length,
    });
  } catch (err) {
    console.error("List roles error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Get single role by ID with permissions
 */
const readRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: { roleId: "Role ID is required" },
      });
    }

    const role = await Role.findById(roleId).populate("permissions");

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role retrieved successfully",
      data: role,
    });
  } catch (err) {
    console.error("Read role error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Create a new role
 */
const createRole = async (req, res) => {
  try {
    const validation = validateRole(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const { name, description } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: "Role already exists",
        errors: { name: `Role "${name}" already exists` },
      });
    }

    const role = await Role.create({
      name,
      description: description || "",
      permissions: [],
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (err) {
    console.error("Create role error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Update a role
 */
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: { roleId: "Role ID is required" },
      });
    }

    const validation = validateRole(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if new name is unique (if changing name)
    if (req.body.name && req.body.name !== role.name) {
      const existingRole = await Role.findOne({ name: req.body.name });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: "Role name already exists",
          errors: { name: `Role "${req.body.name}" already exists` },
        });
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

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Delete a role
 */
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: { roleId: "Role ID is required" },
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Prevent deletion of system roles
    const systemRoles = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"];
    if (systemRoles.includes(role.name)) {
      return res.status(403).json({
        success: false,
        message: `Cannot delete system role "${role.name}"`,
      });
    }

    await Role.findByIdAndDelete(roleId);

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
      data: {
        id: roleId,
        name: role.name,
      },
    });
  } catch (err) {
    console.error("Delete role error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const role = await Role.findById(roleId).populate("permissions");
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Check if permission already assigned
    const isAssigned = role.permissions.some((p) => p._id.toString() === permissionId);
    if (isAssigned) {
      return res.status(409).json({
        success: false,
        message: "Permission already assigned to this role",
      });
    }

    role.permissions.push(permissionId);
    await role.save();
    await role.populate("permissions");

    res.status(200).json({
      success: true,
      message: "Permission assigned successfully",
      data: {
        role: role.name,
        permission: permission.name,
        totalPermissions: role.permissions.length,
      },
    });
  } catch (err) {
    console.error("Assign permission error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const role = await Role.findById(roleId).populate("permissions");
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Check if permission is assigned
    const isAssigned = role.permissions.some((p) => p._id.toString() === permissionId);
    if (!isAssigned) {
      return res.status(404).json({
        success: false,
        message: "Permission not assigned to this role",
      });
    }

    role.permissions = role.permissions.filter(
      (p) => p._id.toString() !== permissionId
    );
    await role.save();
    await role.populate("permissions");

    res.status(200).json({
      success: true,
      message: "Permission removed successfully",
      data: {
        role: role.name,
        permission: permission.name,
        totalPermissions: role.permissions.length,
      },
    });
  } catch (err) {
    console.error("Remove permission error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * View permissions of a role
 */
const viewPermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId || roleId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: { roleId: "Role ID is required" },
      });
    }

    const role = await Role.findById(roleId).populate("permissions");

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role permissions retrieved successfully",
      data: {
        roleId: role._id,
        roleName: role.name,
        roleDescription: role.description,
        permissions: role.permissions,
        totalPermissions: role.permissions.length,
      },
    });
  } catch (err) {
    console.error("View permissions error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
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
