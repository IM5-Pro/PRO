/**
 * Scheduler Service
 * Handles all scheduled tasks like auto-marking attendance, sending notifications, etc.
 */

import { CronJob } from "cron";
import { autoMarkAttendance } from "./attendanceAutoMarkService.js";

let scheduledJobs = [];

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduledJobs = () => {
  try {
    console.log("📅 Initializing scheduled jobs...");

    // Run auto-mark attendance every day at 10:00 PM
    // This gives employees 2 working days to record their attendance
    const autoMarkJob = new CronJob("0 22 * * *", async () => {
      console.log(
        `\n⏰ Running scheduled task: Auto-mark attendance at ${new Date().toISOString()}`
      );
      try {
        await autoMarkAttendance();
      } catch (err) {
        console.error("Error in auto-mark attendance job:", err);
      }
    }, null, true);

    scheduledJobs.push({
      name: "autoMarkAttendance",
      job: autoMarkJob,
      schedule: "0 22 * * * (10 PM daily)",
    });

    console.log("✅ Scheduled jobs initialized:");
    scheduledJobs.forEach((job) => {
      console.log(`   - ${job.name}: ${job.schedule}`);
    });
  } catch (err) {
    console.error("Error initializing scheduled jobs:", err);
  }
};

/**
 * Stop all scheduled jobs
 */
export const stopScheduledJobs = () => {
  try {
    console.log("🛑 Stopping scheduled jobs...");
    scheduledJobs.forEach((job) => {
      job.job.stop();
      console.log(`   - Stopped: ${job.name}`);
    });
    scheduledJobs = [];
    console.log("✅ All scheduled jobs stopped");
  } catch (err) {
    console.error("Error stopping scheduled jobs:", err);
  }
};

/**
 * Manually trigger auto-mark attendance (for testing or manual execution)
 */
export const triggerAutoMark = async () => {
  try {
    console.log(
      "🔄 Manually triggering auto-mark attendance task..."
    );
    await autoMarkAttendance();
    return { success: true, message: "Auto-mark task completed" };
  } catch (err) {
    console.error("Error triggering auto-mark:", err);
    throw err;
  }
};

export default { initializeScheduledJobs, stopScheduledJobs, triggerAutoMark };
