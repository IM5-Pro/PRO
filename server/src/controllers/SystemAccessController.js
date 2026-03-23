import SystemAccess from "../models/SystemAccess.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const getSystemAccess = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const access = await SystemAccess.findOne({ employee: employeeId });
    return sendSuccess(res, 200, "System access fetched", { data: access });
  } catch (err) {
    return sendError(res, 500, "Failed to fetch system access", { error: err.message });
  }
};

export const updateSystemAccess = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updated = await SystemAccess.findOneAndUpdate({ employee: employeeId }, req.body, { new: true, upsert: true });
    return sendSuccess(res, 200, "System access updated", { data: updated });
  } catch (err) {
    return sendError(res, 500, "Failed to update system access", { error: err.message });
  }
};
