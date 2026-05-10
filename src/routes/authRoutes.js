import express from "express";
const authRouter = express.Router();

import { signUp, login, resetPassword, sendOTP, verifyForgotOTP, verifySignUpOTP, forgotPassword, resendOTP, me , createSubAdmin, getSubAdmins, assignPermissionRole, getAllUsers , getUserById, deleteUserById } from '../controllers/authController.js';
import { createChildren, deleteChildren, getAllChildrens, getChildrenById, updateChildren } from "../controllers/childrenController.js";
import { otpRateLimiter } from '../middlewares/otpRateLimiter.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import checkPermission from "../middlewares/checkPermissionMiddleware.js";

// middleware add korte hobe admin auth implement r por
authRouter.post("/signUp",  signUp);
authRouter.post("/login",  login);
authRouter.post("/resetPassword", resetPassword);
authRouter.post("/sendOTP", otpRateLimiter, sendOTP);
authRouter.post("/verifyForgotOTP",  verifyForgotOTP);
authRouter.post("/verifySignUpOTP",  verifySignUpOTP);
authRouter.post("/forgotPassword",  forgotPassword);
authRouter.post("/resendOtp", otpRateLimiter, resendOTP);
authRouter.get("/me", authMiddleware, me);
authRouter.post("/children", authMiddleware, createChildren);
authRouter.get("/children", authMiddleware, getAllChildrens);
authRouter.get("/children/:childrenId", authMiddleware, getChildrenById);
authRouter.put("/children/:childrenId", authMiddleware, updateChildren);
authRouter.delete("/children/:childrenId", authMiddleware, deleteChildren);
authRouter.post(
  "/subadmins",
  authMiddleware,
  checkPermission("Role Management", "create"),
  createSubAdmin,
);
authRouter.get(
  "/subadmins",
  authMiddleware,
  checkPermission("Role Management", "read"),
  getSubAdmins,
);
authRouter.put(
  "/subadmins/:id/permission-role",
  authMiddleware,
  checkPermission("Role Management", "update"),
  assignPermissionRole,
);
authRouter.delete(
  "/subadmins/:id",
  authMiddleware,
  checkPermission("Role Management", "delete"),
  deleteUserById,
);
authRouter.get(
  "/",
  authMiddleware,
  checkPermission("User Management", "read"),
  getAllUsers,
);
authRouter.get(
  "/:id",
  authMiddleware,
  checkPermission("User Management", "read"),
  getUserById,
);
authRouter.delete(
  "/:id",
  authMiddleware,
  checkPermission("User Management", "delete"),
  deleteUserById,
);

export default authRouter;
