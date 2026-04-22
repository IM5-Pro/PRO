import { verifyAccessToken } from "../utils/jwt.js";

const authGuard = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { ...decoded, id: decoded.id || decoded.sub };

    next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authGuard;