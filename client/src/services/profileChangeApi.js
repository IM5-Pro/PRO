import API from '../api/client';
import { EMPLOYEE_ENDPOINTS } from '../api/endpoints';

const unwrap = (res) => {
  const body = res?.data;
  if (body?.data !== undefined && !Array.isArray(body.data)) {
    return body;
  }
  return body;
};

export const fetchMyProfileChangeRequest = async () => {
  const res = await API.get(EMPLOYEE_ENDPOINTS.myProfileChangeRequest);
  const body = unwrap(res);
  return body?.request || body?.data?.request || null;
};

export const submitProfileForApproval = async (payload, { submitForApproval = true } = {}) => {
  const res = await API.put(EMPLOYEE_ENDPOINTS.updateProfile, {
    ...payload,
    submitForApproval,
  });
  return unwrap(res);
};

export const fetchPendingProfileChanges = async () => {
  const res = await API.get(EMPLOYEE_ENDPOINTS.profileChangesPending);
  const body = unwrap(res);
  return body?.requests || [];
};

export const approveProfileChange = async (requestId, remarks = '') => {
  const res = await API.post(EMPLOYEE_ENDPOINTS.profileChangeApprove(requestId), { remarks });
  return unwrap(res);
};

export const rejectProfileChange = async (requestId, remarks = '') => {
  const res = await API.post(EMPLOYEE_ENDPOINTS.profileChangeReject(requestId), { remarks });
  return unwrap(res);
};

/** Merge approved employee record with pending proposed changes for display */
export const mergeProfileWithPending = (profile, pendingRequest) => {
  if (!pendingRequest?.proposedChanges || pendingRequest.status !== 'PENDING') {
    return { display: profile, hasPending: false };
  }
  const patch = pendingRequest.proposedChanges;
  const ec = patch.emergencyContact || profile.emergencyContact;
  return {
    hasPending: true,
    display: {
      ...profile,
      firstName: patch.firstName ?? profile.firstName,
      middleName: patch.middleName ?? profile.middleName,
      lastName: patch.lastName ?? profile.lastName,
      phone: patch.phoneNumber ?? patch.phone ?? profile.phone,
      gender: patch.gender ?? profile.gender,
      bloodGroup: patch.bloodGroup ?? profile.bloodGroup,
      panNumber: patch.panNumber ?? profile.panNumber,
      aadhaarNumber: patch.aadhaarNumber ?? profile.aadhaarNumber,
      address: patch.addressLine ?? patch.address?.street ?? profile.address,
      city: patch.city ?? profile.city,
      state: patch.state ?? profile.state,
      zipCode: patch.zipCode ?? profile.zipCode,
      country: patch.address?.country ?? patch.country ?? profile.country,
      emergencyContact: ec,
      dob: patch.dateOfBirth
        ? new Date(patch.dateOfBirth).toLocaleDateString()
        : profile.dob,
      dateOfBirthInput: patch.dateOfBirth
        ? String(patch.dateOfBirth).slice(0, 10)
        : profile.dateOfBirthInput,
    },
  };
};
