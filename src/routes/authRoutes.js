import express from "express";
const authRouter = express.Router();

import { signUp, login, resetPassword, sendOTP, verifyForgotOTP , verifySignUpOTP ,forgotPassword } from '../controllers/authController.js';

authRouter.post("/signUp", signUp);
authRouter.post("/login", login);
authRouter.post("/resetPassword", resetPassword);
authRouter.post("/sendOTP", sendOTP);
authRouter.post("/verifyForgotOTP", verifyForgotOTP);
authRouter.post("/verifySignUpOTP", verifySignUpOTP);
authRouter.post("/forgotPassword", forgotPassword);

export default authRouter;
