import Experience from "../models/Experience.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const getExperience = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const experience = await Experience.find({ employee: employeeId });
    return sendSuccess(res, 200, "Experience details fetched", { data: experience });
  } catch (err) {
    return sendError(res, 500, "Failed to fetch experience", { error: err.message });
  }
};

export const addExperience = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const newExp = new Experience({ ...req.body, employee: employeeId });
    await newExp.save();
    return sendSuccess(res, 201, "Experience added", { data: newExp });
  } catch (err) {
    return sendError(res, 500, "Failed to add experience", { error: err.message });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Experience.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, 200, "Experience updated", { data: updated });
  } catch (err) {
    return sendError(res, 500, "Failed to update experience", { error: err.message });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    await Experience.findByIdAndDelete(id);
    return sendSuccess(res, 200, "Experience deleted");
  } catch (err) {
    return sendError(res, 500, "Failed to delete experience", { error: err.message });
  }
};
