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
        message: "You cannot create users"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      role
    });

    res.json({
      success: true,
      message: "User created successfully",
      data: user
    });

  } catch (err) {
    res.status(500).json(err);
  }
};

const getEmployees = async (req, res) => {

  const users = await User.find({
    role: "EMPLOYEE"
  });

  res.json({
    success: true,
    message: "Employees retrieved successfully",
    data: users
  });
};

export default {
  createUser,
  getEmployees
};