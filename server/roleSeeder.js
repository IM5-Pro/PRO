import mongoose from "mongoose";
import dotenv from "dotenv";
import RolesConst from "./src/constants/roles.js";
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
    permissions: [...permissionsList],
  },
  {
    name: "HR_ADMIN",
    description:
      "HR Administrator can manage employees and managers (may create users)",
    permissions: permissionsList.filter(
      (p) =>
        p.startsWith("employee.") ||
        p.startsWith("leave.") ||
        p.startsWith("attendance.") ||
        p === "payroll.view" ||
        p === "payroll.process" ||
        p.startsWith("report.") ||
        p === "user.create",
    ),
  },
  {
    name: "MANAGER",
    description: "Manager can view employees but cannot create users",
    permissions: [
      "employee.view_team",
      "attendance.view_team",
      "leave.approve",
      "leave.reject",
      ...permissionsList.filter((p) => p.startsWith("performance.")),
    ],
  },
  {
    name: "EMPLOYEE",
    description: "Employee with basic access",
    permissions: [
      "employee.view_profile",
      "attendance.checkin",
      "attendance.checkout",
      "leave.apply",
      "leave.view_own",
      "payroll.view_own",
      "document.upload",
      "document.view",
    ],
  },
];

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/hrms",
    );

    console.log("Connected to MongoDB");

    // Clear existing permissions & roles
    await Permission.deleteMany({});
    await Role.deleteMany({});
    console.log("Cleared existing permissions and roles");

    // create permissions first
    const createdPerms = [];
    for (const name of permissionsList) {
      try {
        const p = new Permission({ name });
        await p.save();
        createdPerms.push(p);
      } catch (err) {
        if (err.code === 11000) continue;
        else throw err;
      }
    }
    const idMap = Object.fromEntries(createdPerms.map((p) => [p.name, p._id]));

    // now roles with reference ids
    for (const roleData of roles) {
      try {
        const roleDoc = new Role({
          name: roleData.name,
          description: roleData.description,
          permissions: (roleData.permissions || [])
            .map((n) => idMap[n])
            .filter(Boolean),
        });
        await roleDoc.save();
        console.log(`Role ${roleData.name} created successfully`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`Role ${roleData.name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log("Role seeding completed successfully");
  } catch (error) {
    console.error("Error seeding roles:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// run the seeder only if this module is the main script
// (index.js already calls it after DB connection)
if (process.env.NODE_ENV !== "test") {
  seedRoles();
}

// export seed function for scripts/tests
export default seedRoles;
