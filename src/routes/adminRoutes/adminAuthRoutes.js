import express from "express";
import {
  forgotPassword,
  login,
  me,
  resendOTP,
  resetPassword,
  sendOTP,
  verifyForgotOTP,
  verifySignUpOTP,
} from "../../controllers/AdminControllers/adminAuthController.js";
import subAdminRouter from "./subAdminRoutes.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
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
adminAuthRouter.use("/", subAdminRouter);

export default adminAuthRouter;
