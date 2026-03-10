import express from "express";
import departmentController from "../controllers/DepartmentController.js";
import authGuard from "../middleware/authGuard.js";
import permissionGuard from "../middleware/permissionGuard.js";

const router = express.Router();

// create department
router.post(
  "/",
  authGuard,
  permissionGuard("department.create"),
  departmentController.createDepartment,
);

// list departments
router.get(
  "/",
  authGuard,
  permissionGuard("department.list"),
  departmentController.getDepartments,
);

// read single department
router.get(
  "/:id",
  authGuard,
  permissionGuard("department.read"),
  departmentController.readDepartment,
);

// update department name
router.put(
  "/:id",
  authGuard,
  permissionGuard("department.update"),
  departmentController.updateDepartment,
);

// delete department
router.delete(
  "/:id",
  authGuard,
  permissionGuard("department.delete"),
  departmentController.deleteDepartment,
);

// assign/change manager
router.patch(
  "/:id/assign-manager",
  authGuard,
  permissionGuard("department.assign_manager"),
  departmentController.assignManager,
);

export default router;
