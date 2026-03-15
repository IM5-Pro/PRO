import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    audienceType: {
      type: String,
      enum: ["ALL", "DEPARTMENT", "ROLE", "LOCATION", "TEAM"],
      default: "ALL",
    },
    audience: {
      department: { type: String, trim: true, lowercase: true },
      role: { type: String, trim: true, uppercase: true },
      location: { type: String, trim: true, lowercase: true },
      teamManagerEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    },
    deliveryChannels: {
      notification: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      dashboardBanner: { type: Boolean, default: true },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: { type: String, required: true, uppercase: true },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dismissedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    publishedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

announcementSchema.index({ isActive: 1, audienceType: 1, createdAt: -1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });
announcementSchema.index({ dismissedBy: 1 });

export default mongoose.model("Announcement", announcementSchema);
