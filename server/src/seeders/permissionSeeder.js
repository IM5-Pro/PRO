import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import { ROLE_PERMISSIONS } from "../config/permissions.js";

const toPermissionName = (resource, action) => `${resource}.${action}`;

const toGroupLabel = (resource) => {
  return String(resource || "general")
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const permissionSeeder = async () => {
  try {
    const permissionCatalog = [];

    Object.entries(ROLE_PERMISSIONS).forEach(([, resources]) => {
      Object.entries(resources || {}).forEach(([resource, actions]) => {
        Object.entries(actions || {}).forEach(([action]) => {
          permissionCatalog.push({
            name: toPermissionName(resource, action),
            module: resource,
            group: toGroupLabel(resource),
            description: `Allows ${action.replace(/_/g, " ")} on ${resource.replace(/_/g, " ")}`,
            isSystem: true,
          });
        });
      });
    });

    const dedupedPermissions = Array.from(
      new Map(permissionCatalog.map((permission) => [permission.name, permission])).values()
    );

    for (const permission of dedupedPermissions) {
      await Permission.updateOne(
        { name: permission.name },
        {
          $set: {
            module: permission.module,
            group: permission.group,
            description: permission.description,
            isSystem: permission.isSystem,
          },
          $setOnInsert: {
            name: permission.name,
          },
        },
        { upsert: true }
      );
    }

    const permissionsByName = new Map(
      (
        await Permission.find({ name: { $in: dedupedPermissions.map((permission) => permission.name) } })
          .select("_id name")
          .lean()
      ).map((permission) => [permission.name, permission._id])
    );

    for (const [roleName, resources] of Object.entries(ROLE_PERMISSIONS)) {
      const allowedPermissionIds = [];

      Object.entries(resources || {}).forEach(([resource, actions]) => {
        Object.entries(actions || {}).forEach(([action, isAllowed]) => {
          if (!isAllowed) {
            return;
          }

          const permissionId = permissionsByName.get(toPermissionName(resource, action));
          if (permissionId) {
            allowedPermissionIds.push(permissionId);
          }
        });
      });

      await Role.updateOne(
        { name: roleName },
        { $set: { permissions: allowedPermissionIds } }
      );
    }

    console.log("Permissions seeded:", dedupedPermissions.length);
  } catch (err) {
    console.error("Error seeding permissions:", err);
  }
};

export default permissionSeeder;