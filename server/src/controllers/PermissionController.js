import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import { validatePermission, validatePermissionAssignment } from "../utils/roleValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";

/**
 * List all permissions
 */
const listPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find({});

    return sendSuccess(res, 200, "Permissions retrieved successfully", { data: permissions, count: permissions.length });
  } catch (err) {
    console.error("List permissions error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * Get single permission by ID with assigned roles
 */
const readPermission = async (req, res) => {
  try {
    const { permissionId } = req.params;

    if (!permissionId || permissionId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: { permissionId: "Permission ID is required" },
      });
    }

    const permission = await Permission.findById(permissionId);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Get roles that have this permission
    const rolesWithPermission = await Role.find({
      permissions: permissionId,
    }).select("_id name description");

    res.status(200).json({
      success: true,
      message: "Permission retrieved successfully",
      data: {
        ...permission.toObject(),
        assignedRoles: rolesWithPermission,
      },
    });
  } catch (err) {
    console.error("Read permission error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Create a new permission
 */
const createPermission = async (req, res) => {
  try {
    const validation = validatePermission(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { name, description } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return sendError(res, 409, "Permission already exists", { name: `Permission "${name}" already exists` });
    }

    const permission = await Permission.create({
      name,
      description: description || "",
    });

    return sendSuccess(res, 201, "Permission created successfully", { data: permission });
  } catch (err) {
    console.error("Create permission error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * Update a permission
 */
const updatePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;

    if (!permissionId || permissionId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { permissionId: "Permission ID is required" });
    }

    const validation = validatePermission(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return sendError(res, 404, "Permission not found");
    }

    // Check if new name is unique (if changing name)
    if (req.body.name && req.body.name !== permission.name) {
      const existingPermission = await Permission.findOne({ name: req.body.name });
      if (existingPermission) {
        return sendError(res, 409, "Permission name already exists", { name: `Permission "${req.body.name}" already exists` });
      }
    }

    const updatedPermission = await Permission.findByIdAndUpdate(
      permissionId,
      {
        name: req.body.name || permission.name,
        description: req.body.description !== undefined ? req.body.description : permission.description,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: updatedPermission,
    });
  } catch (err) {
    console.error("Update permission error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * Delete a permission
 */
const deletePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;

    if (!permissionId || permissionId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: { permissionId: "Permission ID is required" },
      });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Check if permission is assigned to any role
    const rolesWithPermission = await Role.find({
      permissions: permissionId,
    });

    if (rolesWithPermission.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete permission. It is assigned to ${rolesWithPermission.length} role(s)`,
        data: {
          permissionName: permission.name,
          assignedRoles: rolesWithPermission.map((r) => r.name),
        },
      });
    }

    await Permission.findByIdAndDelete(permissionId);

    res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
      data: {
        id: permissionId,
        name: permission.name,
      },
    });
  } catch (err) {
    console.error("Delete permission error:", err);
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
const assignRole = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { roleId } = req.body;

    const validation = validatePermissionAssignment({ permissionId, roleId });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if permission already assigned to this role
    const isAssigned = role.permissions.some((p) => p.toString() === permissionId);
    if (isAssigned) {
      return res.status(409).json({
        success: false,
        message: "Permission already assigned to this role",
      });
    }

    role.permissions.push(permissionId);
    await role.save();

    res.status(200).json({
      success: true,
      message: "Permission assigned to role successfully",
      data: {
        permission: permission.name,
        role: role.name,
        totalPermissionsInRole: role.permissions.length,
      },
    });
  } catch (err) {
    console.error("Assign role error:", err);
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
const removeRole = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { roleId } = req.body;

    const validation = validatePermissionAssignment({ permissionId, roleId });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if permission is assigned to this role
    const isAssigned = role.permissions.some((p) => p.toString() === permissionId);
    if (!isAssigned) {
      return res.status(404).json({
        success: false,
        message: "Permission not assigned to this role",
      });
    }

    role.permissions = role.permissions.filter((p) => p.toString() !== permissionId);
    await role.save();

    res.status(200).json({
      success: true,
      message: "Permission removed from role successfully",
      data: {
        permission: permission.name,
        role: role.name,
        totalPermissionsInRole: role.permissions.length,
      },
    });
  } catch (err) {
    console.error("Remove role error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export {
  listPermissions,
  readPermission,
  createPermission,
  updatePermission,
  deletePermission,
  assignRole,
  removeRole,
};
