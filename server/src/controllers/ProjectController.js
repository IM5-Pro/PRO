import Project from "../models/Project.js";
import { sendError, sendSuccess } from "../utils/response.js";

const normalizeTools = (tools) => {
  if (!Array.isArray(tools)) {
    return [];
  }
  return tools
    .map((t) => ({
      name: String(t?.name || "").trim(),
      notes: String(t?.notes || "").trim(),
    }))
    .filter((t) => t.name);
};

export const listProjects = async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly !== "false";
    const filter = activeOnly ? { isActive: true } : {};
    const projects = await Project.find(filter).sort({ name: 1 }).lean();
    return sendSuccess(res, 200, "Projects retrieved", { data: projects });
  } catch (err) {
    return sendError(res, 500, "Failed to list projects", { error: err.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).lean();
    if (!project) {
      return sendError(res, 404, "Project not found");
    }
    return sendSuccess(res, 200, "Project retrieved", { data: project });
  } catch (err) {
    return sendError(res, 500, "Failed to get project", { error: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, code, requiredTools, isActive } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return sendError(res, 400, "Project name is required");
    }
    const project = await Project.create({
      name: name.trim(),
      code: typeof code === "string" ? code.trim().toUpperCase() : undefined,
      requiredTools: normalizeTools(requiredTools),
      isActive: isActive !== false,
    });
    return sendSuccess(res, 201, "Project created", { data: project });
  } catch (err) {
    return sendError(res, 500, "Failed to create project", { error: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, code, requiredTools, isActive } = req.body;
    const updates = {};
    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (typeof code === "string") {
      updates.code = code.trim().toUpperCase();
    }
    if (Array.isArray(requiredTools)) {
      updates.requiredTools = normalizeTools(requiredTools);
    }
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }
    const project = await Project.findByIdAndUpdate(req.params.projectId, updates, {
      new: true,
    }).lean();
    if (!project) {
      return sendError(res, 404, "Project not found");
    }
    return sendSuccess(res, 200, "Project updated", { data: project });
  } catch (err) {
    return sendError(res, 500, "Failed to update project", { error: err.message });
  }
};
