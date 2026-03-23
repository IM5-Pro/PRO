import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as assetController from "../controllers/AssetController.js";

const router = express.Router();

router.get("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER", "EMPLOYEE"), assetController.getAssets);
router.post("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN"), assetController.addAsset);
router.put("/:id", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN"), assetController.updateAsset);
router.delete("/:id", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN"), assetController.deleteAsset);

export default router;
