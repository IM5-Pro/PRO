import API from '../api/client';
import {
  DEPARTMENT_ENDPOINTS,
  DESIGNATION_ENDPOINTS,
  EMPLOYEE_BULK_ENDPOINTS,
  EMPLOYEE_ENDPOINTS,
  PERFORMANCE_ENDPOINTS,
  PROJECT_ENDPOINTS,
  RECRUITMENT_ENDPOINTS,
  SHIFT_ENDPOINTS,
  TOOL_PROVISIONING_ENDPOINTS,
} from '../api/endpoints';
export const toErrorMessage = (error, fallback = 'Request failed') => {
  const data = error?.response?.data;
  const message = data?.message || data?.error || error?.message;
  const errors = data?.errors;

  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    const details = Object.values(errors)
      .flat()
      .filter(Boolean)
      .join('; ');
    if (details) {
      return message && message !== 'Validation failed'
        ? `${message}: ${details}`
        : details;
    }
  }

  return message || fallback;
};

const toPayload = (response) => response?.data || {};

export const unwrapData = (payload) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
};

export const extractRows = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  if (payload.data && typeof payload.data === 'object') {
    for (const key of keys) {
      if (Array.isArray(payload.data[key])) return payload.data[key];
    }
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
};

// ——— Recruitment ———
export const fetchRecruitmentJobs = async (params = {}) => {
  const response = await API.get(RECRUITMENT_ENDPOINTS.jobs, { params });
  const payload = toPayload(response);
  const data = unwrapData(payload);
  return extractRows(data, ['jobs']) || extractRows(payload, ['jobs']);
};

export const createRecruitmentJob = async (body) => {
  const response = await API.post(RECRUITMENT_ENDPOINTS.jobs, body);
  return unwrapData(toPayload(response));
};

export const updateRecruitmentJob = async (id, body) => {
  const response = await API.put(RECRUITMENT_ENDPOINTS.job(id), body);
  return unwrapData(toPayload(response));
};

export const deleteRecruitmentJob = async (id) => {
  await API.delete(RECRUITMENT_ENDPOINTS.job(id));
};

export const fetchRecruitmentCandidates = async (jobId) => {
  const response = await API.get(RECRUITMENT_ENDPOINTS.candidates(jobId));
  const payload = toPayload(response);
  return extractRows(payload, ['candidates']) || extractRows(unwrapData(payload), ['candidates']);
};

export const applyRecruitmentCandidate = async (body) => {
  const response = await API.post(RECRUITMENT_ENDPOINTS.candidateApply, body);
  return unwrapData(toPayload(response));
};

export const hireRecruitmentCandidate = async (id) => {
  const response = await API.patch(RECRUITMENT_ENDPOINTS.candidateHire(id));
  return unwrapData(toPayload(response));
};

export const rejectRecruitmentCandidate = async (id, reason) => {
  const response = await API.patch(RECRUITMENT_ENDPOINTS.candidateReject(id), { reason });
  return unwrapData(toPayload(response));
};

export const fetchRecruitmentInterviews = async (opts) => {
  const response = await API.get(RECRUITMENT_ENDPOINTS.interviews(opts));
  const payload = toPayload(response);
  return extractRows(payload, ['interviews']) || extractRows(unwrapData(payload), ['interviews']);
};

export const scheduleRecruitmentInterview = async (body) => {
  const response = await API.post(RECRUITMENT_ENDPOINTS.interview, body);
  return unwrapData(toPayload(response));
};

// ——— Tool provisioning ———
export const fetchToolProvisioningTickets = async (status) => {
  const response = await API.get(TOOL_PROVISIONING_ENDPOINTS.list(status));
  const payload = toPayload(response);
  const data = unwrapData(payload);
  return Array.isArray(data) ? data : extractRows(payload, ['data']);
};

export const approveToolProvisioningTicket = async (ticketId) => {
  const response = await API.post(TOOL_PROVISIONING_ENDPOINTS.approve(ticketId));
  return unwrapData(toPayload(response));
};

export const rejectToolProvisioningTicket = async (ticketId, reason) => {
  const response = await API.post(TOOL_PROVISIONING_ENDPOINTS.reject(ticketId), { reason });
  return unwrapData(toPayload(response));
};

// ——— Projects ———
export const fetchProjectsList = async (activeOnly = false) => {
  const response = await API.get(PROJECT_ENDPOINTS.list, {
    params: activeOnly ? {} : { activeOnly: 'false' },
  });
  const data = unwrapData(toPayload(response));
  return Array.isArray(data) ? data : [];
};

export const createProjectRecord = async (body) => {
  const response = await API.post(PROJECT_ENDPOINTS.create, body);
  return unwrapData(toPayload(response));
};

export const updateProjectRecord = async (projectId, body) => {
  const response = await API.put(PROJECT_ENDPOINTS.update(projectId), body);
  return unwrapData(toPayload(response));
};

// ——— Shifts ———
export const fetchShiftsList = async (limit = 100) => {
  const response = await API.get(SHIFT_ENDPOINTS.list(limit));
  const payload = toPayload(response);
  return extractRows(payload, ['shifts']) || extractRows(unwrapData(payload), ['shifts']);
};

export const createShiftRecord = async (body) => {
  const response = await API.post(SHIFT_ENDPOINTS.create, body);
  return unwrapData(toPayload(response));
};

export const assignShiftToEmployee = async (body) => {
  const response = await API.post(SHIFT_ENDPOINTS.assign, body);
  return unwrapData(toPayload(response));
};

// ——— Designation / org ———
export const fetchDesignationHierarchy = async () => {
  const response = await API.get(DESIGNATION_ENDPOINTS.hierarchy);
  return unwrapData(toPayload(response));
};

export const fetchOrgChart = async () => {
  const response = await API.get(DESIGNATION_ENDPOINTS.orgChart);
  return unwrapData(toPayload(response));
};

export const assignDesignationToEmployee = async (designationId, employeeId) => {
  const response = await API.post(DESIGNATION_ENDPOINTS.assign(designationId), { employeeId });
  return unwrapData(toPayload(response));
};

export const assignDepartmentManager = async (departmentId, managerId) => {
  const response = await API.post(DEPARTMENT_ENDPOINTS.assignManager(departmentId), { managerId });
  return unwrapData(toPayload(response));
};

// ——— Performance ———
export const fetchPerformanceReviews = async (employeeId) => {
  const response = await API.get(PERFORMANCE_ENDPOINTS.reviews(employeeId));
  const payload = toPayload(response);
  return extractRows(payload, ['reviews']) || extractRows(unwrapData(payload), ['reviews']);
};

export const createPerformanceReview = async (body) => {
  const response = await API.post(PERFORMANCE_ENDPOINTS.review, body);
  return unwrapData(toPayload(response));
};

export const approvePerformanceReview = async (id) => {
  const response = await API.patch(PERFORMANCE_ENDPOINTS.reviewApprove(id));
  return unwrapData(toPayload(response));
};

export const fetchPerformanceGoals = async (employeeId) => {
  const response = await API.get(PERFORMANCE_ENDPOINTS.goals(employeeId));
  const payload = toPayload(response);
  return extractRows(payload, ['goals']) || extractRows(unwrapData(payload), ['goals']);
};

export const createPerformanceGoal = async (body) => {
  const response = await API.post(PERFORMANCE_ENDPOINTS.goal, body);
  return unwrapData(toPayload(response));
};

// ——— Employee bulk ———
export const bulkImportEmployees = async (employees) => {
  const response = await API.post(EMPLOYEE_BULK_ENDPOINTS.bulkImport, { employees });
  return unwrapData(toPayload(response));
};

export const transferEmployeeDepartment = async (employeeId, department) => {
  const response = await API.put(EMPLOYEE_BULK_ENDPOINTS.transferDept(employeeId), { department });
  return unwrapData(toPayload(response));
};

export const fetchEmployeesForSelect = async () => {
  const response = await API.get(EMPLOYEE_ENDPOINTS.list(500));
  const payload = toPayload(response);
  return extractRows(payload, ['data']);
};
