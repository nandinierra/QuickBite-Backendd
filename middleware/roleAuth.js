import jwt from "jsonwebtoken"

export const verifyUser = (req, res, next) => {
  const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token not found"
    })

  }

  try {
    const decoded = jwt.verify(token, process.env.SECRETCODE)
    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    })
  }

}

export const verifyAdmin = (req, res, next) => {
  console.log("--- verifyAdmin Middleware ---");
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.cookies);
  const tokenFromCookie = req.cookies.jwt_token;
  console.log("Token from cookie:", tokenFromCookie);
  const token = tokenFromCookie || req.headers.authorization?.split(" ")[1];
  console.log("Final token used:", token);

  if (!token) {
    return res.status(401).json({
      message: "Token not found"
    })

  }

  try {
    const decoded = jwt.verify(token, process.env.SECRETCODE)

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized: Admin access required"
      })
    }

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    })
  }

}

export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token not found"
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRETCODE);

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          message: `Unauthorized: Only ${allowedRoles.join(", ")} can access this resource`
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }
  };
};

export const verifyPermission = (requiredPermission) => {
  return (req, res, next) => {
    const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token not found"
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRETCODE);

      if (!decoded.permissions || !decoded.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          message: `Unauthorized: ${requiredPermission} permission required`
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }
  };
};

export const verifyMultiplePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token not found"
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRETCODE);

      const hasAllPermissions = requiredPermissions.every(
        perm => decoded.permissions && decoded.permissions.includes(perm)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          message: `Unauthorized: ${requiredPermissions.join(", ")} permissions required`
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }
  };
};
