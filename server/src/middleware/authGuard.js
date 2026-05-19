import { verifyAccessToken } from "../utils/jwt.js";
import { getAccessTokenFromRequest } from "../utils/sessionCookies.js";
import User from "../models/User.js";

/**
 * Verifies JWT from HttpOnly cookie (preferred) or Authorization header,
 * then applies current role / active state from DB.
 */
const authGuard = async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const userId = decoded.id || decoded.sub;

    const live = await User.findById(userId).select("role isActive employeeId").lean();
    if (!live || !live.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = {
      ...decoded,
      id: userId,
      role: live.role,
      employeeId: live.employeeId || null,
    };

    next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authGuard;
