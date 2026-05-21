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

/** Sparse unique fields must be omitted or $unset — never stored as null. */
export const SPARSE_UNIQUE_EMPLOYEE_FIELDS = ["panNumber", "aadhaarNumber"];

const isEmptySparseField = (value) =>
  value === null || value === undefined || value === "";

/**
 * Build a Mongoose update for Employee: clears sparse-unique fields via $unset
 * instead of setting null (which violates unique index).
 */
export const toEmployeeMongoUpdate = (patch) => {
  if (!patch || typeof patch !== "object") return {};

  const set = {};
  const unset = {};

  for (const [key, value] of Object.entries(patch)) {
    if (SPARSE_UNIQUE_EMPLOYEE_FIELDS.includes(key)) {
      if (isEmptySparseField(value)) {
        unset[key] = "";
      } else {
        set[key] = value;
      }
    } else {
      set[key] = value;
    }
  }

  if (Object.keys(unset).length === 0) {
    return set;
  }

  const update = { $unset: unset };
  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  return update;
};

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
