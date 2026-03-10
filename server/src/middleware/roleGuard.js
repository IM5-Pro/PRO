const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    // super‑admin always allowed
    if (req.user && req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    next();
  };
};

export default roleGuard;
