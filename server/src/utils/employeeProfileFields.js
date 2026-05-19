/**
 * Canonical employee profile field groups (HR create vs employee self-service vs HR-only).
 */

export const HR_CREATE_EMPLOYEE_FIELDS = [
  "firstName",
  "middleName",
  "lastName",
  "email",
  "department",
  "designation",
  "salary",
  "joinDate",
  "phoneNumber",
  "managerId",
  "accountRole",
  "assignedProjectId",
];

export const EMPLOYEE_SELF_SERVICE_FIELDS = [
  "firstName",
  "middleName",
  "lastName",
  "phoneNumber",
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "panNumber",
  "aadhaarNumber",
  "addressLine",
  "city",
  "state",
  "zipCode",
  "country",
  "emergencyContact",
];

export const HR_ONLY_FIELDS = [
  "department",
  "designation",
  "salary",
  "managerId",
  "employmentType",
  "status",
  "employeeCode",
  "joinDate",
  "assignedProjectId",
];

export const PROFILE_DISPLAY_SECTIONS = {
  personal: [
    "firstName",
    "middleName",
    "lastName",
    "email",
    "phoneNumber",
    "dateOfBirth",
    "gender",
    "bloodGroup",
    "panNumber",
    "aadhaarNumber",
  ],
  address: ["addressLine", "city", "state", "zipCode", "country"],
  emergency: ["emergencyContact"],
  job: [
    "employeeCode",
    "department",
    "designation",
    "employmentType",
    "joinDate",
    "manager",
    "status",
    "salary",
  ],
};
