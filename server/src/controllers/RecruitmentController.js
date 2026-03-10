// RecruitmentController contains stubs for job and candidate operations.

import { sendError, sendSuccess } from "../utils/response.js";

const createJob = async (req, res) => {
  sendSuccess(res, 201, "Job created (stub)");
};

const updateJob = async (req, res) => {
  sendSuccess(res, 200, "Job updated (stub)");
};

const deleteJob = async (req, res) => {
  sendSuccess(res, 200, "Job deleted (stub)");
};

const viewJobs = async (req, res) => {
  sendSuccess(res, 200, "Jobs listed (stub)");
};

const applyCandidate = async (req, res) => {
  sendSuccess(res, 201, "Candidate applied (stub)");
};

const updateCandidate = async (req, res) => {
  sendSuccess(res, 200, "Candidate updated (stub)");
};

const deleteCandidate = async (req, res) => {
  sendSuccess(res, 200, "Candidate deleted (stub)");
};

const scheduleInterview = async (req, res) => {
  sendSuccess(res, 201, "Interview scheduled (stub)");
};

const updateInterview = async (req, res) => {
  sendSuccess(res, 200, "Interview updated (stub)");
};

const rejectCandidate = async (req, res) => {
  sendSuccess(res, 200, "Candidate rejected (stub)");
};

const hireCandidate = async (req, res) => {
  sendSuccess(res, 200, "Candidate hired (stub)");
};

export default {
  createJob,
  updateJob,
  deleteJob,
  viewJobs,
  applyCandidate,
  updateCandidate,
  deleteCandidate,
  scheduleInterview,
  updateInterview,
  rejectCandidate,
  hireCandidate,
};
