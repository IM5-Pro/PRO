import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  // user may include permissions array already populated
  const payload = { id: user.id, role: user.role };
  if (user.permissions) payload.permissions = user.permissions;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export { generateAccessToken, generateRefreshToken };
