import Department from "../models/Department.js";

// create a new department
const createDepartment = async (req, res) => {
  try {
    const { name, managerId } = req.body;
    const department = await Department.create({ name, managerId });
    res.json({ success: true, data: department });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Department name already exists" });
    }
    res.status(500).json(err);
  }
};

// list all departments (or filtered by query parameters later)
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json(err);
  }
};

// read single department by id
const readDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.json({ success: true, data: department });
  } catch (err) {
    res.status(500).json(err);
  }
};

// update department metadata
const updateDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: { name } },
      { new: true },
    );
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.json({ success: true, data: department });
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete department (hard delete – you may soft delete in real app)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// assign or change manager of a department
const assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: { managerId } },
      { new: true },
    );
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.json({ success: true, data: department });
  } catch (err) {
    res.status(500).json(err);
  }
};

export default {
  createDepartment,
  getDepartments,
  readDepartment,
  updateDepartment,
  deleteDepartment,
  assignManager,
};
