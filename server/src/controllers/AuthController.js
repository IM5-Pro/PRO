import bcrypt from "bcrypt";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js"; // ensure mongoose registers the Permission schema
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

const registerSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await User.findOne({ role: "SUPER_ADMIN" });

    if (exist) {
      return res.status(400).json({
        message: "Super admin already exists",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      role: "SUPER_ADMIN",
    });

    res.json({
      success: true,
      message: "Super admin registered successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  // fetch role document to get permissions
  const roleDoc = await Role.findOne({ name: user.role }).populate(
    "permissions",
  );
  const permissions = roleDoc ? roleDoc.permissions.map((p) => p.name) : [];

  const tokenUser = {
    id: user._id,
    role: user.role,
    permissions,
  };

  const accessToken = generateAccessToken(tokenUser);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    success: true,
    message: "Login successful",
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        permissions,
      },
    },
  });
};

export default { registerSuperAdmin, login };
