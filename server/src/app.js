import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/AuthRouter.js";
import userRoutes from "./routes/UserRouter.js";
import departmentRoutes from "./routes/DepartmentRouter.js";
import leaveRoutes from "./routes/LeaveRouter.js";
import payrollRoutes from "./routes/PayrollRouter.js";
import attendanceRoutes from "./routes/AttendanceRouter.js";
import shiftRoutes from "./routes/ShiftRouter.js";
import recruitmentRoutes from "./routes/RecruitmentRouter.js";
import performanceRoutes from "./routes/PerformanceRouter.js";
import documentRoutes from "./routes/DocumentRouter.js";
import roleRoutes from "./routes/RoleRouter.js";
import permissionRoutes from "./routes/PermissionRouter.js";
import adminRoutes from "./routes/AdminRouter.js";
import employeeRoutes from "./routes/EmployeeRouter.js";
import designationRoutes from "./routes/DesignationRouter.js";
import announcementRoutes from "./routes/AnnouncementRouter.js";
import resignationRoutes from "./routes/ResignationRouter.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import educationRoutes from "./routes/EducationRouter.js";
import experienceRoutes from "./routes/ExperienceRouter.js";
import assetRoutes from "./routes/AssetRouter.js";
import systemAccessRoutes from "./routes/SystemAccessRouter.js";
import projectRoutes from "./routes/ProjectRouter.js";
import toolProvisioningRoutes from "./routes/ToolProvisioningRouter.js";
import insuranceRoutes from "./routes/InsuranceRouter.js";
import securityHeaders from "./middleware/securityHeaders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const validateRequiredEnv = () => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const required = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
  if (process.env.NODE_ENV === "production") {
    required.push("SUPER_ADMIN_SETUP_KEY");
  }

  const missing = required.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || !value.trim();
  });

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    process.exit(1);
  }
};

validateRequiredEnv();

const app = express();

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5000",
        process.env.CLIENT_ORIGIN,
        ...(process.env.CLIENT_ORIGINS || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/resignations", resignationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/system-access", systemAccessRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tool-provisioning-tickets", toolProvisioningRoutes);
app.use("/api/insurance", insuranceRoutes);

export default app;
