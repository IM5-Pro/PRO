import express from "express";
import payrollController from "../controllers/PayrollController.js";
import authGuard from "../middleware/authGuard.js";
import {permissionGuard} from "../middleware/permissionGuard.js";

const router = express.Router();

router.post(
  "/",
  authGuard,
  permissionGuard("payroll.create"),
  payrollController.createPayroll,
);

router.post(
  "/process",
  authGuard,
  permissionGuard("payroll.process"),
  payrollController.processPayroll,
);

router.post(
  "/:runId/process",
  authGuard,
  permissionGuard("payroll.process"),
  payrollController.processPayroll,
);

router.patch(
  "/:id/approve",
  authGuard,
  permissionGuard("payroll.approve"),
  payrollController.approvePayroll,
);

router.patch(
  "/:id/reject",
  authGuard,
  permissionGuard("payroll.reject"),
  payrollController.rejectPayroll,
);

router.post(
  "/generate-slips",
  authGuard,
  permissionGuard("payroll.generate_slips"),
  payrollController.generateSlips,
);

router.post(
  "/:runId/generate-slips",
  authGuard,
  permissionGuard("payroll.generate_slips"),
  payrollController.generateSlips,
);

router.get(
  "/own",
  authGuard,
  permissionGuard("payroll.view_own"),
  payrollController.viewOwn,
);

router.get(
  "/all",
  authGuard,
  permissionGuard("payroll.view_all"),
  payrollController.viewAll,
);

router.get(
  "/download/:id",
  authGuard,
  permissionGuard("payroll.download_slip"),
  payrollController.downloadSlip,
);

router.get(
  "/export",
  authGuard,
  permissionGuard("payroll.export"),
  payrollController.exportPayroll,
);

router.get(
  "/:runId/export",
  authGuard,
  permissionGuard("payroll.export"),
  payrollController.exportPayroll,
);

router.patch(
  "/salary/:id",
  authGuard,
  permissionGuard("payroll.update_salary"),
  payrollController.updateSalary,
);

router.get(
  "/structure",
  authGuard,
  permissionGuard("payroll.view_salary_structure"),
  payrollController.viewSalaryStructure,
);

router.patch(
  "/structure",
  authGuard,
  permissionGuard("payroll.update_salary_structure"),
  payrollController.updateSalaryStructure,
);

router.patch(
  "/structure/:templateId",
  authGuard,
  permissionGuard("payroll.update_salary_structure"),
  payrollController.updateSalaryStructure,
);

router.post(
  "/tax/calculate",
  authGuard,
  permissionGuard("payroll.tax_calculate"),
  payrollController.taxCalculate,
);

router.patch(
  "/tax/update",
  authGuard,
  permissionGuard("payroll.tax_update"),
  payrollController.taxUpdate,
);

router.post(
  "/bonus",
  authGuard,
  permissionGuard("payroll.bonus_add"),
  payrollController.bonusAdd,
);

router.post(
  "/deduction",
  authGuard,
  permissionGuard("payroll.deduction_add"),
  payrollController.deductionAdd,
);

router.patch(
  "/lock",
  authGuard,
  permissionGuard("payroll.lock"),
  payrollController.lockPayroll,
);

router.patch(
  "/:runId/lock",
  authGuard,
  permissionGuard("payroll.lock"),
  payrollController.lockPayroll,
);

router.patch(
  "/unlock",
  authGuard,
  permissionGuard("payroll.unlock"),
  payrollController.unlockPayroll,
);

router.patch(
  "/:runId/unlock",
  authGuard,
  permissionGuard("payroll.unlock"),
  payrollController.unlockPayroll,
);

export default router;
