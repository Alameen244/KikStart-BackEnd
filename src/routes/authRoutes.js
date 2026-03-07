import express from "express";
const authRouter = express.Router();

import { signUp, login, resetPassword, sendOTP, verifyForgotOTP, verifySignUpOTP, forgotPassword, resendOtp } from '../controllers/authController.js';
import { otpRateLimiter } from '../middlewares/otpRateLimiter.js';
import { middleware } from '../middlewares/authMiddleware.js';

authRouter.post("/signUp", signUp);
authRouter.post("/login", login);
authRouter.post("/resetPassword", middleware, resetPassword);
authRouter.post("/sendOTP", otpRateLimiter, sendOTP);
authRouter.post("/verifyForgotOTP", otpRateLimiter, verifyForgotOTP);
authRouter.post("/verifySignUpOTP", otpRateLimiter, verifySignUpOTP);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.post("/resendOtp", otpRateLimiter, resendOTP);

export default authRouter;
