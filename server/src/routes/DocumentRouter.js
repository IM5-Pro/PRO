import express from "express";
import documentController from "../controllers/DocumentController.js";
import authGuard from "../middleware/authGuard.js";
import permissionGuard from "../middleware/permissionGuard.js";

const router = express.Router();

// upload document
router.post(
  "/",
  authGuard,
  permissionGuard("document.upload"),
  documentController.uploadDocument,
);

// view document details (or list)
router.get(
  "/:id",
  authGuard,
  permissionGuard("document.view"),
  documentController.viewDocument,
);

// download document
router.get(
  "/:id/download",
  authGuard,
  permissionGuard("document.download"),
  documentController.downloadDocument,
);

// update metadata or file
router.put(
  "/:id",
  authGuard,
  permissionGuard("document.update"),
  documentController.updateDocument,
);

// delete document
router.delete(
  "/:id",
  authGuard,
  permissionGuard("document.delete"),
  documentController.deleteDocument,
);

// share document
router.post(
  "/:id/share",
  authGuard,
  permissionGuard("document.share"),
  documentController.shareDocument,
);

// archive & restore
router.patch(
  "/:id/archive",
  authGuard,
  permissionGuard("document.archive"),
  documentController.archiveDocument,
);

router.patch(
  "/:id/restore",
  authGuard,
  permissionGuard("document.restore"),
  documentController.restoreDocument,
);

export default router;
