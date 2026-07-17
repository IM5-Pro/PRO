import connectDB from "../src/config/db.js";
import { triggerResignationNoticeCompletions } from "../src/services/schedulerService.js";

export const handler = async () => {
  await connectDB();
  await triggerResignationNoticeCompletions();
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
