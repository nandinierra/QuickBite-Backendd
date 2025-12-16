import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const headers = req.headers.authorization;
  const token = headers?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({
      message: "Token not found"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.SECRETCODE);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Forbidden: Admin access required",
      requiredRole: "admin",
      userRole: req.user?.role || "guest"
    });
  }
  next();
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user?.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        message: `Forbidden: ${permission} permission required`,
        requiredPermission: permission,
        userPermissions: req.user?.permissions || []
      });
    }
    next();
  };
};

export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user?.permissions) {
      return res.status(403).json({
        message: "Forbidden: No permissions assigned",
        requiredPermissions: permissions
      });
    }
    
    const hasPermission = permissions.some(perm => 
      req.user.permissions.includes(perm)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        message: `Forbidden: One of ${permissions.join(", ")} required`,
        requiredPermissions: permissions,
        userPermissions: req.user.permissions
      });
    }
    next();
  };
};

export const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user?.permissions) {
      return res.status(403).json({
        message: "Forbidden: No permissions assigned",
        requiredPermissions: permissions
      });
    }
    
    const hasAllPermissions = permissions.every(perm => 
      req.user.permissions.includes(perm)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        message: `Forbidden: All permissions required: ${permissions.join(", ")}`,
        requiredPermissions: permissions,
        userPermissions: req.user.permissions
      });
    }
    next();
  };
};

export const isPublic = (req, res, next) => {
  next();
};
