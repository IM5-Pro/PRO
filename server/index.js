import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/AuthRouter.js";
import userRoutes from "./src/routes/UserRouter.js";
import departmentRoutes from "./src/routes/DepartmentRouter.js";
import leaveRoutes from "./src/routes/LeaveRouter.js";
import payrollRoutes from "./src/routes/PayrollRouter.js";
import attendanceRoutes from "./src/routes/AttendanceRouter.js";
import recruitmentRoutes from "./src/routes/RecruitmentRouter.js";
import performanceRoutes from "./src/routes/PerformanceRouter.js";
import documentRoutes from "./src/routes/DocumentRouter.js";
import roleRoutes from "./src/routes/RoleRouter.js";
import permissionRoutes from "./src/routes/PermissionRouter.js";
import adminRoutes from "./src/routes/AdminRouter.js";
import employeeRoutes from "./src/routes/EmployeeRouter.js";
import designationRoutes from "./src/routes/DesignationRouter.js";
import announcementRoutes from "./src/routes/AnnouncementRouter.js";
import manpowerPlanningRoutes from "./src/routes/ManpowerPlanningRouter.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import roleSeeder from "./src/seeders/roleSeeder.js";
import departmentSeeder from "./src/seeders/departmentSeeder.js";
import permissionSeeder from "./src/seeders/permissionSeeder.js";
import designationSeeder from "./src/seeders/designationSeeder.js";
import educationRoutes from "./src/routes/EducationRouter.js";
import experienceRoutes from "./src/routes/ExperienceRouter.js";
import assetRoutes from "./src/routes/AssetRouter.js";
import systemAccessRoutes from "./src/routes/SystemAccessRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  // seed core data after successful connection in dependency order
  (async () => {
    await roleSeeder();
    await permissionSeeder();
    await departmentSeeder();
    await designationSeeder();
  })();
});
// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/manpower-planning", manpowerPlanningRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/system-access", systemAccessRoutes);

// start server only when not running tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is Running at ${PORT}`);
  });
}

export default app;
