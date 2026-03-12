import jwt from "jsonwebtoken";

const JWT_ISSUER = process.env.JWT_ISSUER || "hrms-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "hrms-client";

const generateAccessToken = (user) => {
  const userId = user.id || user.sub;
  const payload = {
    sub: String(userId),
    id: userId,
    role: user.role,
    employeeId: user.employeeId || null,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

const generateRefreshToken = (user) => {
  const userId = user.id || user.sub;
  return jwt.sign({ sub: String(userId), id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
