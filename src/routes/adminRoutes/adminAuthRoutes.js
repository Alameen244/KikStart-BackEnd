import express from "express";
import {
  assignPermissionRole,
  createSubAdmin,
  deleteUserById,
  forgotPassword,
  getAllUsers,
  getSubAdmins,
  getUserById,
  login,
  me,
  resendOTP,
  resetPassword,
  sendOTP,
  verifyForgotOTP,
  verifySignUpOTP,
} from "../../controllers/AdminControllers/adminAuthController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";
import { otpRateLimiter } from "../../middlewares/otpRateLimiter.js";

const adminAuthRouter = express.Router();

adminAuthRouter.post("/login", login);
adminAuthRouter.post("/resetPassword", resetPassword);
adminAuthRouter.post("/sendOTP", otpRateLimiter, sendOTP);
adminAuthRouter.post("/verifyForgotOTP", verifyForgotOTP);
adminAuthRouter.post("/verifySignUpOTP", verifySignUpOTP);
adminAuthRouter.post("/forgotPassword", forgotPassword);
adminAuthRouter.post("/resendOtp", otpRateLimiter, resendOTP);
adminAuthRouter.get("/me", authMiddleware, me);

adminAuthRouter.post(
  "/subadmins",
  authMiddleware,
  checkPermission("Role Management", "create"),
  createSubAdmin,
);
adminAuthRouter.get(
  "/subadmins",
  authMiddleware,
  checkPermission("Role Management", "read"),
  getSubAdmins,
);
adminAuthRouter.put(
  "/subadmins/:id/permission-role",
  authMiddleware,
  checkPermission("Role Management", "update"),
  assignPermissionRole,
);
adminAuthRouter.delete(
  "/subadmins/:id",
  authMiddleware,
  checkPermission("Role Management", "delete"),
  deleteUserById,
);

adminAuthRouter.get(
  "/users",
  authMiddleware,
  checkPermission("User Management", "read"),
  getAllUsers,
);
adminAuthRouter.get(
  "/users/:id",
  authMiddleware,
  checkPermission("User Management", "read"),
  getUserById,
);
adminAuthRouter.delete(
  "/users/:id",
  authMiddleware,
  checkPermission("User Management", "delete"),
  deleteUserById,
);

export default adminAuthRouter;
