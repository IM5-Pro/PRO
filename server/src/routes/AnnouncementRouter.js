import express from "express";
import announcementController from "../controllers/AnnouncementController.js";
import authGuard from "../middleware/authGuard.js";

const router = express.Router();

router.use(authGuard);

router.get("/", announcementController.listAnnouncements);
router.post("/", announcementController.createAnnouncement);
router.put("/:id", announcementController.updateAnnouncement);
router.delete("/:id", announcementController.deleteAnnouncement);
router.post("/:id/dismiss", announcementController.dismissAnnouncement);

export default router;
