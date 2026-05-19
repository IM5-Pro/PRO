import Employee from "../models/Employee.js";
import User from "../models/User.js";

const populateEmployeeQuery = (query) =>
  query
    .populate("managerID", "firstName lastName email designation")
    .populate("managerId", "firstName lastName email designation");

export const resolveCurrentEmployee = async (userId, employeeIdHint = null) => {
  const normalizedHint =
    typeof employeeIdHint === "string" && employeeIdHint.trim()
      ? employeeIdHint.trim()
      : employeeIdHint;

  if (normalizedHint) {
    const employeeByHint = await populateEmployeeQuery(Employee.findById(normalizedHint));
    if (employeeByHint) {
      return employeeByHint;
    }
  }

  const authUser = await User.findById(userId).select("employeeId").lean();
  if (authUser?.employeeId) {
    const employeeByLinkedId = await populateEmployeeQuery(Employee.findById(authUser.employeeId));
    if (employeeByLinkedId) {
      return employeeByLinkedId;
    }
  }

  let employee = await populateEmployeeQuery(Employee.findById(userId));

  if (!employee) {
    employee = await populateEmployeeQuery(Employee.findOne({ createdBy: userId }));
  }

  return employee;
};

export const resolveCurrentEmployeeId = async (userId, employeeIdHint = null) => {
  const currentEmployee = await resolveCurrentEmployee(userId, employeeIdHint);
  return currentEmployee?._id?.toString() || null;
};

export const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
