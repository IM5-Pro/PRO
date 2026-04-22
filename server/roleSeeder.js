import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Role from "./src/models/Role.js";
import Permission from "./src/models/Permission.js";
import { permissionsList, roles } from "./src/config/roleDefinitions.js";

// Load environment variables
dotenv.config();

export { permissionsList, roles };

const SYSTEM_MODULES = new Set([
  "auth",
  "role",
  "permission",
  "config",
  "auditlog",
  "system",
]);

const MODULE_GROUPS = {
  auth: "Authentication",
  user: "User Management",
  role: "Role Management",
  permission: "Permission Management",
  employee: "Employee",
  department: "Department",
  designation: "Designation",
  attendance: "Attendance",
  leave: "Leave",
  payroll: "Payroll",
  recruitment: "Recruitment",
  performance: "Performance",
  document: "Document",
  notification: "Notification",
  report: "Reports",
  config: "System Configuration",
  auditlog: "Audit Logs",
  system: "System",
};

const toPermissionDoc = (name) => {
  const [module = "general", ...actionParts] = name.split(".");
  const action = actionParts.join("_") || "access";

  const description = `${action.replace(/_/g, " ")} ${module} permission`;

  return {
    name,
    module,
    description: description.charAt(0).toUpperCase() + description.slice(1),
    isSystem: SYSTEM_MODULES.has(module),
    group: MODULE_GROUPS[module] || "General",
  };
};

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    // Upsert all permissions in bulk (safe for production, no destructive delete)
    const permissionOperations = permissionsList.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $set: toPermissionDoc(name) },
        upsert: true,
      },
    }));

    await Permission.bulkWrite(permissionOperations, { ordered: false });

    const allPermissions = await Permission.find({
      name: { $in: permissionsList },
    }).select("_id name");
    const idMap = Object.fromEntries(allPermissions.map((permission) => [permission.name, permission._id]));

    // Upsert roles in bulk and refresh mapped permission references
    const roleOperations = roles.map((roleData) => ({
      updateOne: {
        filter: { name: roleData.name },
        update: {
          $set: {
            description: roleData.description,
            roleVersion: roleData.roleVersion || 1,
            permissions: (roleData.permissions || [])
              .map((name) => idMap[name])
              .filter(Boolean),
          },
        },
        upsert: true,
      },
    }));

    await Role.bulkWrite(roleOperations, { ordered: false });

    console.log(`Permissions upserted: ${permissionOperations.length}`);
    console.log(`Roles upserted: ${roleOperations.length}`);
    console.log("Role seeding completed successfully");
  } catch (error) {
    console.error("Error seeding roles:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// run the seeder only when executed directly (not when imported)
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun && process.env.NODE_ENV !== "test") {
  seedRoles();
}

// export seed function for scripts/tests
export default seedRoles;
