import AuthModel from "../models/authModel.js";

const checkPermission = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      const user = await AuthModel.findById(req.jwtPayload?.id).populate(
        "permissionRole",
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role === "admin") {
        return next();
      }

      if (user.role !== "subAdmin" || !user.permissionRole) {
        return res.status(403).json({
          success: false,
          message: "No role or insufficient privileges",
        });
      }

      const permissions = user.permissionRole.permissions || [];
      const permission = permissions.find((item) => item.module === moduleName);

      if (!permission) {
        return res.status(403).json({
          success: false,
          message: `No permission found for module: ${moduleName}`,
        });
      }

      if (!permission.actions?.[action]) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: '${action}' not allowed on '${moduleName}'`,
        });
      }

      return next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during permission check",
      });
    }
  };
};

export default checkPermission;
