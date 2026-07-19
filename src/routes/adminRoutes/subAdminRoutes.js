import express from "express";
import {
  assignPermissionRole,
  createSubAdmin,
  deleteUserById,
  exportAllUsers,
  getAllUsers,
  getSubAdmins,
  getUserById,
} from "../../controllers/AdminControllers/subAdminController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";

const subAdminRouter = express.Router();

subAdminRouter.post(
  "/subadmins",
  authMiddleware,
  checkPermission("Role Management", "create"),
  createSubAdmin,
);
subAdminRouter.get(
  "/subadmins",
  authMiddleware,
  checkPermission("Role Management", "read"),
  getSubAdmins,
);
subAdminRouter.put(
  "/subadmins/:id/permission-role",
  authMiddleware,
  checkPermission("Role Management", "update"),
  assignPermissionRole,
);
subAdminRouter.delete(
  "/subadmins/:id",
  authMiddleware,
  checkPermission("Role Management", "delete"),
  deleteUserById,
);

subAdminRouter.get(
  "/users",
  authMiddleware,
  checkPermission("User Management", "read"),
  getAllUsers,
);
subAdminRouter.get(
  "/users/export",
  authMiddleware,
  checkPermission("User Management", "read"),
  exportAllUsers,
);
subAdminRouter.get(
  "/users/:id",
  authMiddleware,
  checkPermission("User Management", "read"),
  getUserById,
);
subAdminRouter.delete(
  "/users/:id",
  authMiddleware,
  checkPermission("User Management", "delete"),
  deleteUserById,
);

export default subAdminRouter;
