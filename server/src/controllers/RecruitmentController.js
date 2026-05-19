// RecruitmentController handles job postings, candidate applications, and interviews

import mongoose from "mongoose";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import Interview from "../models/Interview.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { validateJob, validateCandidate, validateInterview } from "../utils/recruitmentValidators.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));

const normalizeSalaryRange = (salaryRange) => {
  if (salaryRange && salaryRange.min != null && salaryRange.max != null) {
    return {
      min: Number(salaryRange.min),
      max: Number(salaryRange.max),
    };
  }
  return { min: 0, max: 0 };
};

/**
 * Create a new job posting
 */
const createJob = async (req, res) => {
  try {
    const validation = validateJob(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const {
      title,
      description,
      department,
      designationId,
      location,
      jobType,
      salaryRange,
      requiredSkills,
      requirements,
      experience,
      qualifications,
      closingDate,
      vacancies,
    } = req.body;

    const job = await Job.create({
      title,
      description,
      department,
      ...(designationId && isValidObjectId(designationId) ? { designationId } : {}),
      location,
      jobType,
      salaryRange: normalizeSalaryRange(salaryRange),
      requiredSkills: requiredSkills || [],
      requirements,
      experience,
      qualifications,
      postedBy: req.user.id || req.user._id,
      closingDate,
      vacancies: vacancies || 1,
    });

    sendSuccess(res, 201, "Job created successfully", job);
  } catch (err) {
    console.error("Create job error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Update a job posting
 */
const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id || req.params.jobId;

    if (!jobId || jobId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { jobId: "Job ID is required" });
    }

    const validation = validateJob(req.body, { partial: true });
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return sendError(res, 404, "Job not found");
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, { new: true });

    sendSuccess(res, 200, "Job updated successfully", updatedJob);
  } catch (err) {
    console.error("Update job error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Delete a job posting
 */
const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id || req.params.jobId;

    if (!jobId || jobId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { jobId: "Job ID is required" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return sendError(res, 404, "Job not found");
    }

    await Job.findByIdAndDelete(jobId);

    sendSuccess(res, 200, "Job deleted successfully", { id: jobId });
  } catch (err) {
    console.error("Delete job error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * List all jobs or filter by status
 */
const viewJobs = async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (department) {
      filter.department = department;
    }

    const jobs = await Job.find(filter).populate("designationId postedBy").sort({ createdAt: -1 });

    sendSuccess(res, 200, "Jobs retrieved successfully", { jobs, count: jobs.length });
  } catch (err) {
    console.error("View jobs error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * List candidates (optional jobId filter)
 */
const listCandidates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.jobId) {
      if (!isValidObjectId(req.query.jobId)) {
        return sendError(res, 400, "Validation failed", { jobId: "Invalid job ID" });
      }
      filter.jobId = req.query.jobId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const candidates = await Candidate.find(filter)
      .populate("jobId", "title department status")
      .sort({ createdAt: -1 });
    sendSuccess(res, 200, "Candidates retrieved successfully", {
      candidates,
      count: candidates.length,
    });
  } catch (err) {
    console.error("List candidates error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * List interviews (optional jobId / candidateId filter)
 */
const listInterviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.jobId) {
      if (!isValidObjectId(req.query.jobId)) {
        return sendError(res, 400, "Validation failed", { jobId: "Invalid job ID" });
      }
      filter.jobId = req.query.jobId;
    }
    if (req.query.candidateId) {
      if (!isValidObjectId(req.query.candidateId)) {
        return sendError(res, 400, "Validation failed", { candidateId: "Invalid candidate ID" });
      }
      filter.candidateId = req.query.candidateId;
    }
    const interviews = await Interview.find(filter)
      .populate("candidateId", "firstName lastName email status")
      .populate("jobId", "title department")
      .sort({ scheduledDate: -1 });
    sendSuccess(res, 200, "Interviews retrieved successfully", {
      interviews,
      count: interviews.length,
    });
  } catch (err) {
    console.error("List interviews error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Apply for a job (create candidate record)
 */
const applyCandidate = async (req, res) => {
  try {
    const validation = validateCandidate(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { firstName, lastName, email, phone, jobId, resume, coverLetter, experience, qualifications, skills, currentCompany, currentDesignation, expectedSalary, noticePeriod } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return sendError(res, 404, "Job not found");
    }

    // Check if candidate already applied
    const existingApplication = await Candidate.findOne({ email, jobId });
    if (existingApplication) {
      return sendError(res, 409, "You have already applied for this job");
    }

    const candidate = await Candidate.create({
      firstName,
      lastName,
      email,
      phone,
      jobId,
      resume,
      coverLetter,
      experience,
      qualifications,
      skills: skills || [],
      currentCompany,
      currentDesignation,
      expectedSalary,
      noticePeriod,
      appliedBy: req.user._id,
    });

    sendSuccess(res, 201, "Application submitted successfully", candidate);
  } catch (err) {
    console.error("Apply candidate error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Update candidate status or information
 */
const updateCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id || req.params.candidateId;

    if (!candidateId || candidateId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { candidateId: "Candidate ID is required" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return sendError(res, 404, "Candidate not found");
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(candidateId, req.body, { new: true });

    sendSuccess(res, 200, "Candidate updated successfully", updatedCandidate);
  } catch (err) {
    console.error("Update candidate error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Delete a candidate application
 */
const deleteCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id || req.params.candidateId;

    if (!candidateId || candidateId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { candidateId: "Candidate ID is required" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return sendError(res, 404, "Candidate not found");
    }

    await Candidate.findByIdAndDelete(candidateId);

    sendSuccess(res, 200, "Candidate deleted successfully", { id: candidateId });
  } catch (err) {
    console.error("Delete candidate error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Schedule an interview
 */
const scheduleInterview = async (req, res) => {
  try {
    const validation = validateInterview(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { candidateId, jobId, interviewType, scheduledDate, scheduledTime, location, meetingLink } = req.body;

    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return sendError(res, 404, "Candidate not found");
    }

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return sendError(res, 404, "Job not found");
    }

    const interview = await Interview.create({
      candidateId,
      jobId,
      interviewType,
      scheduledDate,
      scheduledTime,
      interviewer: req.user._id,
      location,
      meetingLink,
    });

    sendSuccess(res, 201, "Interview scheduled successfully", interview);
  } catch (err) {
    console.error("Schedule interview error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Update interview details or status
 */
const updateInterview = async (req, res) => {
  try {
    const interviewId = req.params.id || req.params.interviewId;

    if (!interviewId || interviewId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { interviewId: "Interview ID is required" });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return sendError(res, 404, "Interview not found");
    }

    const updatedInterview = await Interview.findByIdAndUpdate(interviewId, req.body, { new: true });

    sendSuccess(res, 200, "Interview updated successfully", updatedInterview);
  } catch (err) {
    console.error("Update interview error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Reject a candidate
 */
const rejectCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id || req.params.candidateId;
    const { reason } = req.body;

    if (!candidateId || candidateId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { candidateId: "Candidate ID is required" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return sendError(res, 404, "Candidate not found");
    }

    const rejectedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { status: "REJECTED", notes: reason || "" },
      { new: true }
    );

    sendSuccess(res, 200, "Candidate rejected successfully", rejectedCandidate);
  } catch (err) {
    console.error("Reject candidate error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Hire a candidate
 */
const hireCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id || req.params.candidateId;

    if (!candidateId || candidateId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { candidateId: "Candidate ID is required" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return sendError(res, 404, "Candidate not found");
    }

    const hiredCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { status: "HIRED" },
      { new: true }
    );

    sendSuccess(res, 200, "Candidate hired successfully", hiredCandidate);
  } catch (err) {
    console.error("Hire candidate error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

export default {
  createJob,
  updateJob,
  deleteJob,
  viewJobs,
  listCandidates,
  listInterviews,
  applyCandidate,
  updateCandidate,
  deleteCandidate,
  scheduleInterview,
  updateInterview,
  rejectCandidate,
  hireCandidate,
};
