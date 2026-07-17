import connectDB from "../src/config/db.js";
import { triggerAutoMark } from "../src/services/schedulerService.js";

export const handler = async () => {
  await connectDB();
  await triggerAutoMark();
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
