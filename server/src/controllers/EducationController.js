import Education from "../models/Education.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const getEducation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const education = await Education.find({ employee: employeeId });
    return sendSuccess(res, 200, "Education details fetched", { data: education });
  } catch (err) {
    return sendError(res, 500, "Failed to fetch education", { error: err.message });
  }
};

export const addEducation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const newEdu = new Education({ ...req.body, employee: employeeId });
    await newEdu.save();
    return sendSuccess(res, 201, "Education added", { data: newEdu });
  } catch (err) {
    return sendError(res, 500, "Failed to add education", { error: err.message });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Education.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, 200, "Education updated", { data: updated });
  } catch (err) {
    return sendError(res, 500, "Failed to update education", { error: err.message });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    await Education.findByIdAndDelete(id);
    return sendSuccess(res, 200, "Education deleted");
  } catch (err) {
    return sendError(res, 500, "Failed to delete education", { error: err.message });
  }
};
