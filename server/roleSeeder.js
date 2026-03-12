import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Role from "./src/models/Role.js";
import Permission from "./src/models/Permission.js";

// Load environment variables
dotenv.config();

// permissions catalog (a subset shown; expand to ~160 as needed)
export const permissionsList = [
  // 1️⃣ Authentication
  "auth.login",
  "auth.logout",
  "auth.refresh_token",
  "auth.forgot_password",
  "auth.reset_password",
  "auth.change_password",
  "auth.mfa_enable",
  "auth.mfa_disable",
  "auth.session_view",
  "auth.session_terminate",
  // 2️⃣ User Management
  "user.create",
  "user.read",
  "user.update",
  "user.delete",
  "user.activate",
  "user.deactivate",
  "user.assign_role",
  "user.remove_role",
  "user.reset_password",
  "user.list",
  // 3️⃣ Role Management
  "role.create",
  "role.read",
  "role.update",
  "role.delete",
  "role.assign_permissions",
  "role.remove_permissions",
  "role.list",
  "role.view_permissions",
  // 4️⃣ Permission Management
  "permission.create",
  "permission.read",
  "permission.update",
  "permission.delete",
  "permission.list",
  "permission.assign_role",
  "permission.remove_role",
  // 5️⃣ Employee Management
  "employee.create",
  "employee.read",
  "employee.update",
  "employee.delete",
  "employee.view_profile",
  "employee.update_profile",
  "employee.upload_documents",
  "employee.download_documents",
  "employee.view_salary",
  "employee.transfer_department",
  "employee.change_designation",
  "employee.change_manager",
  "employee.activate",
  "employee.deactivate",
  "employee.list",
  "employee.export",
  "employee.import",
  "employee.bulk_update",
  "employee.view_history",
  // 6️⃣ Department Management
  "department.create",
  "department.read",
  "department.update",
  "department.delete",
  "department.assign_manager",
  "department.list",
  // 7️⃣ Designation Management
  "designation.create",
  "designation.read",
  "designation.update",
  "designation.delete",
  "designation.list",
  "designation.assign",
  // 8️⃣ Attendance Management
  "attendance.checkin",
  "attendance.checkout",
  "attendance.view_own",
  "attendance.view_team",
  "attendance.view_all",
  "attendance.edit",
  "attendance.delete",
  "attendance.bulk_upload",
  "attendance.export",
  "attendance.approve",
  "attendance.reject",
  "attendance.shift_assign",
  "attendance.shift_update",
  "attendance.shift_delete",
  // 9️⃣ Leave Management
  "leave.apply",
  "leave.cancel",
  "leave.update",
  "leave.view_own",
  "leave.view_team",
  "leave.view_all",
  "leave.approve",
  "leave.reject",
  "leave.bulk_approve",
  "leave.policy_create",
  "leave.policy_update",
  "leave.policy_delete",
  "leave.policy_view",
  "leave.balance_view",
  "leave.balance_adjust",
  // 🔟 Payroll Management
  "payroll.create",
  "payroll.process",
  "payroll.approve",
  "payroll.reject",
  "payroll.generate_slips",
  "payroll.view_own",
  "payroll.view_all",
  "payroll.download_slip",
  "payroll.export",
  "payroll.update_salary",
  "payroll.view_salary_structure",
  "payroll.update_salary_structure",
  "payroll.tax_calculate",
  "payroll.tax_update",
  "payroll.bonus_add",
  "payroll.deduction_add",
  "payroll.lock",
  "payroll.unlock",
  // 1️⃣1️⃣ Recruitment / Hiring
  "recruitment.create_job",
  "recruitment.update_job",
  "recruitment.delete_job",
  "recruitment.view_jobs",
  "recruitment.apply_candidate",
  "recruitment.update_candidate",
  "recruitment.delete_candidate",
  "recruitment.schedule_interview",
  "recruitment.update_interview",
  "recruitment.reject_candidate",
  "recruitment.hire_candidate",
  // 1️⃣2️⃣ Performance Management
  "performance.create_review",
  "performance.update_review",
  "performance.delete_review",
  "performance.view_review",
  "performance.submit_review",
  "performance.approve_review",
  "performance.reject_review",
  "performance.goal_create",
  "performance.goal_update",
  "performance.goal_delete",
  "performance.goal_assign",
  "performance.goal_view",
  // 1️⃣3️⃣ Document Management
  "document.upload",
  "document.view",
  "document.download",
  "document.delete",
  "document.update",
  "document.share",
  "document.archive",
  "document.restore",
  // 1️⃣4️⃣ Notifications
  "notification.create",
  "notification.send",
  "notification.read",
  "notification.delete",
  "notification.broadcast",
  "notification.schedule",
  // 1️⃣5️⃣ Reports & Analytics
  "report.employee",
  "report.attendance",
  "report.leave",
  "report.payroll",
  "report.performance",
  "report.export",
  "report.custom_generate",
  "report.dashboard_view",
  // 1️⃣6️⃣ System Configuration
  "config.view",
  "config.update",
  "config.backup",
  "config.restore",
  "config.email_settings",
  "config.security_settings",
  "config.api_keys",
  "config.integrations",
  // 1️⃣7️⃣ Audit Logs
  "auditlog.view",
  "auditlog.export",
  "auditlog.delete",
  "auditlog.archive",
  // 1️⃣8️⃣ Super Admin Controls
  "system.user_impersonate",
  "system.lock",
  "system.unlock",
  "system.maintenance_mode",
  "system.feature_toggle",
  "system.global_settings",
];

export const roles = [
  {
    name: "SUPER_ADMIN",
    description: "Super Administrator with full system access",
    roleVersion: 1,
    permissions: [...permissionsList],
  },
  {
    name: "HR_ADMIN",
    description:
      "HR Administrator can manage employees and managers (may create users)",
    roleVersion: 1,
    permissions: permissionsList.filter(
      (p) =>
        p.startsWith("employee.") ||
        p.startsWith("leave.") ||
        p.startsWith("attendance.") ||
        p.startsWith("department.") ||
        p.startsWith("payroll.") ||
        p.startsWith("performance.") ||
        p.startsWith("document.") ||
        p.startsWith("report.") ||
        p.startsWith("recruitment.") ||
        p === "user.create",
    ),
  },
  {
    name: "MANAGER",
    description: "Manager can view employees but cannot create users",
    roleVersion: 1,
    permissions: [
      "employee.view_team",
      "attendance.view_team",
      "leave.view_own",
      "leave.view_team",
      "leave.approve",
      "leave.reject",
      "department.read",
      "department.list",
      "recruitment.update_job",
      "recruitment.view_jobs",
      "recruitment.schedule_interview",
      "recruitment.update_interview",
      "recruitment.reject_candidate",
      // manager performance rights
      "performance.update_review",
      "performance.view_review",
      "performance.approve_review",
      "performance.reject_review",
      "performance.goal_create",
      "performance.goal_update",
      "performance.goal_assign",
      "performance.goal_view",
      // document permissions for managers
      "document.view",
      "document.download",
      "document.share",
      // managers get no payroll permissions per matrix
    ],
  },
  {
    name: "EMPLOYEE",
    description: "Employee with basic access",
    roleVersion: 1,
    permissions: [
      "employee.view_profile",
      "attendance.checkin",
      "attendance.checkout",
      "leave.apply",
      "leave.view_own",
      "payroll.view_own",
      "document.upload",
      "document.view",
      "recruitment.view_jobs",
      "recruitment.apply_candidate",
      // employee performance
      "performance.view_review",
      "performance.submit_review",
      "performance.goal_view",
      // employee document
      "document.view",
      "document.download",
    ],
  },
];

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
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/hrms",
    );

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
