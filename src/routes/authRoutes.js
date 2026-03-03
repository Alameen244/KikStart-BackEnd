import express from "express";
const authRouter = express.Router();

import { signUp, login, resetPassword, sendOTP, verifyForgotOTP, verifySignUpOTP, forgotPassword } from '../controllers/authController.js';
import { otpRateLimiter } from '../app.js';

authRouter.post("/signUp", signUp);
authRouter.post("/login", login);
authRouter.post("/resetPassword", resetPassword);
authRouter.post("/sendOTP", otpRateLimiter, sendOTP);
authRouter.post("/verifyForgotOTP", otpRateLimiter, verifyForgotOTP);
authRouter.post("/verifySignUpOTP", otpRateLimiter, verifySignUpOTP);
authRouter.post("/forgotPassword", forgotPassword);

export default authRouter;
