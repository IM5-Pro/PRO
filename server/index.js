import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/AuthRouter.js";
import userRoutes from "./src/routes/UserRouter.js";
import departmentRoutes from "./src/routes/DepartmentRouter.js";
import leaveRoutes from "./src/routes/LeaveRouter.js";
import payrollRoutes from "./src/routes/PayrollRouter.js";
import recruitmentRoutes from "./src/routes/RecruitmentRouter.js";
import performanceRoutes from "./src/routes/PerformanceRouter.js";
import documentRoutes from "./src/routes/DocumentRouter.js";
import roleSeeder from "./src/seeders/roleSeeder.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  // seed roles after successful connection
  roleSeeder();
});
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/documents", documentRoutes);

// start server only when not running tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is Running at ${PORT}`);
  });
}

export default app;
