const permissionGuard = (requiredPermission) => {
  return (req, res, next) => {
    // super‑admin bypasses all permission checks
    if (req.user && req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!req.user || !req.user.permissions) {
      return res
        .status(403)
        .json({ message: "Forbidden – insufficient permission" });
    }

    // support passing either a single string or array
    if (Array.isArray(requiredPermission)) {
      const hasAny = requiredPermission.some((p) =>
        req.user.permissions.includes(p),
      );
      if (!hasAny) {
        return res
          .status(403)
          .json({ message: "Forbidden – insufficient permission" });
      }
    } else {
      if (!req.user.permissions.includes(requiredPermission)) {
        return res
          .status(403)
          .json({ message: "Forbidden – insufficient permission" });
      }
    }

    next();
  };
};

export default permissionGuard;
