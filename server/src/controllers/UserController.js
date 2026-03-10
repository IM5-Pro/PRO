import bcrypt from "bcrypt";
import User from "../models/User.js";

const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const creatorRole = req.user.role;

    if (creatorRole === "SUPER_ADMIN") {
      if (!["HR_ADMIN", "MANAGER", "EMPLOYEE"].includes(role)) {
        return res.status(403).json({ message: "Invalid role creation" });
      }
    }

    if (creatorRole === "HR_ADMIN") {
      if (!["MANAGER", "EMPLOYEE"].includes(role)) {
        return res.status(403).json({ message: "Invalid role creation" });
      }
    }

    if (creatorRole === "MANAGER" || creatorRole === "EMPLOYEE") {
      return res.status(403).json({
        message: "You cannot create users",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      role,
    });

    res.json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

const getEmployees = async (req, res) => {
  const users = await User.find({
    role: "EMPLOYEE",
  });

  res.json({
    success: true,
    message: "Employees retrieved successfully",
    data: users,
  });
};

// Read user by ID
const readUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Update user by ID
const updateUser = async (req, res) => {
  try {
    const { email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { email, role, isActive } },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Activate user
const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true } },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Assign role to user
const assignRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Remove role from user
const removeRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $unset: { role: "" } },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { password: hash } },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, message: "Password reset", data: user });
  } catch (err) {
    res.status(500).json(err);
  }
};

export default {
  createUser,
  getEmployees,
  readUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  assignRole,
  removeRole,
  resetPassword,
};
