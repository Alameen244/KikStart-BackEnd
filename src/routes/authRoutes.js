import express from "express";
const authRouter = express.Router();

import { signUp, login, googleAuth, resetPassword, sendOTP, verifyForgotOTP, verifySignUpOTP, forgotPassword, resendOTP, me, getAllUsers } from '../controllers/authController.js';
import { createChildren, deleteChildren, getAllChildrens, getChildrenById, updateChildren } from "../controllers/childrenController.js";
import { otpRateLimiter } from '../middlewares/otpRateLimiter.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// middleware add korte hobe admin auth implement r por
authRouter.post("/signUp",  signUp);
authRouter.post("/login",  login);
authRouter.get("/google", googleAuth);
authRouter.post("/resetPassword", resetPassword);
authRouter.post("/sendOTP", otpRateLimiter, sendOTP);
authRouter.post("/verifyForgotOTP",  verifyForgotOTP);
authRouter.post("/verifySignUpOTP",  verifySignUpOTP);
authRouter.post("/forgotPassword",  forgotPassword);
authRouter.post("/resendOtp", otpRateLimiter, resendOTP);
authRouter.get("/me", authMiddleware, me);
authRouter.get("/users", authMiddleware, getAllUsers);
authRouter.post("/children", authMiddleware, createChildren);
authRouter.get("/children", authMiddleware, getAllChildrens);
authRouter.get("/children/:childrenId", authMiddleware, getChildrenById);
authRouter.put("/children/:childrenId", authMiddleware, updateChildren);
authRouter.delete("/children/:childrenId", authMiddleware, deleteChildren);

export default authRouter;
