import Employee from "../models/Employee.js";

const findByEmail = (email, session = null) => {
  const query = Employee.findOne({ email });
  if (session) query.session(session);
  return query;
};

const createEmployee = (payload, session) => {
  return Employee.create([payload], { session }).then((docs) => docs[0]);
};

const findById = (employeeId, projection = null, session = null) => {
  const query = Employee.findById(employeeId, projection);
  if (session) query.session(session);
  return query;
};

const updateById = (employeeId, payload, options = {}) => {
  return Employee.findByIdAndUpdate(employeeId, payload, {
    new: true,
    ...options,
  });
};

const listByQuery = ({ query, sort, limit, skip, select }) => {
  let cursor = Employee.find(query);

  if (select) {
    cursor = cursor.select(select);
  }

  if (sort) {
    cursor = cursor.sort(sort);
  }

  if (typeof skip === "number") {
    cursor = cursor.skip(skip);
  }

  if (typeof limit === "number") {
    cursor = cursor.limit(limit);
  }

  return cursor;
};

const countByQuery = (query) => Employee.countDocuments(query);

const insertManyEmployees = (employees, options = {}) => {
  return Employee.insertMany(employees, options);
};

const findByEmails = (emails) => {
  return Employee.find({ email: { $in: emails } }).select("email");
};

const findWithManager = (employeeId) => {
  return Employee.findById(employeeId).select("managerID");
};

export {
  findByEmail,
  createEmployee,
  findById,
  updateById,
  listByQuery,
  countByQuery,
  insertManyEmployees,
  findByEmails,
  findWithManager,
};
