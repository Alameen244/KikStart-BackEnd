
import AuthModel from "../models/authModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { sendEmail } from "../utils/mailer.js";
import otpTemplate from "../Templates/otpTemplate.js";
import userTemplate from "../Templates/signUpTemplate.js";
import resetTemplate from "../Templates/resetTemplate.js";

const normalizeEmail = (email) => email?.trim().toLowerCase();

// generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const passwordSchema = Joi.string()
    .min(8)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .required();

const validatePassword = (password) => {
    const { error } = passwordSchema.validate(password, { abortEarly: false });
    if (!error) return null;

    const messages = [];
    if (password.length < 8) {
        messages.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
        messages.push("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
        messages.push("Password must contain at least one number");
    }
    return messages.join(", ");
};

const signToken = (user) => {
    if (!process.env.SECRET_KEY) {
        throw new Error("SECRET_KEY is not configured");
    }
    // Reduced from 365d to 7d to limit exposure window of stolen tokens
    return jwt.sign({ id: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: "7d" });
};

const sanitizeUser = (user) => {
    const obj = user?.toObject ? user.toObject() : user;
    if (!obj) return obj;
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpiry;
    delete obj.forgotOtpVerification;
    delete obj.isVerified;
    return obj;
};

// sign-up
const signUp = async (req, res) => {
    try {
        const data = req.body;
        const email = normalizeEmail(data.email);

        if (!email || !data.password || !data.name || !data.phone || !data.pinCode || !data.location) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        const passwordError = validatePassword(data.password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        const existingUser = await AuthModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPass = await bcrypt.hash(data.password, 10);
        const newUser = await AuthModel.create({
            name: data.name,
            email,
            password: hashedPass,
            phone: data.phone,
            pinCode: data.pinCode,
            location: data.location,
            isVerified: false
        });

        if (!newUser) {
            return res.status(500).json({
                success: false,
                message: "User creation failed"
            });
        }

        // OTP generate for sign up verification
        const otp = generateOTP();
        newUser.otp = otp;
        newUser.otpExpiry = new Date(Date.now() + 3 * 60 * 1000);
        await newUser.save();

        try {
            await sendEmail({
                to: email,
                subject: "Verify your email",
                text: `Your OTP is ${otp}. It will expire in 3 minutes.`,
                html: otpTemplate(otp)
            });
        } catch (emailError) {
            // user will delete if otp failed to send for sign up verification because without otp verification user can't login and also for security reasons
            await AuthModel.findByIdAndDelete(newUser._id);
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Please try again."
            });
        }

        return res.status(201).json({
            success: true,
            message: "User created successfully. OTP sent to your email.",
            data: sanitizeUser(newUser)
        });
    } catch (error) {
        console.error("signUp error:", error);
        return res.status(500).json({
            success: false,
            message: "User creation failed"
        });
    }
};

// login
const login = async (req, res) => {
    try {
        const data = req.body;
        const email = normalizeEmail(data.email);
        if (!email || !data.password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        const existingUser = await AuthModel.findOne({ email }).select("+password");
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // isVerified check
        if (!existingUser.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first"
            });
        }

        const isMatch = await bcrypt.compare(data.password, existingUser.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = signToken(existingUser);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: sanitizeUser(existingUser)
        });
    } catch (error) {
        console.error("login error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

// reset password (with old password)
const resetPassword = async (req, res) => {
    try {
        const data = req.body;
        const email = normalizeEmail(data.email);
        if (!email || !data.newPassword || !data.password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }
        const newPasswordError = validatePassword(data.newPassword);
        if (newPasswordError) {
            return res.status(400).json({
                success: false,
                message: newPasswordError
            });
        }

        const user = await AuthModel.findOne({ email }).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isCorrect = await bcrypt.compare(data.password, user.password);
        if (!isCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        const isSame = await bcrypt.compare(data.newPassword, user.password);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be same as old password"
            });
        }

        user.password = await bcrypt.hash(data.newPassword, 10);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
            data: sanitizeUser(user)
        });
    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Password reset failed"
        });
    }
};



const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email"
            });
        }

        const user = await AuthModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 3 * 60 * 1000);
        user.forgotOtpVerification = false;
        await user.save();

        await sendEmail({
            to: normalizedEmail,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}. It will expire in 3 minutes.`,
            html: otpTemplate(otp)
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        console.error("sendOTP error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP sending failed"
        });
    }
};

// OTP verification
const verifySignUpOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and OTP"
            });
        }
        const user = await AuthModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Welcome to KikStart!",
                text: `Welcome ${user.name}, your account has been verified.`,
                html: userTemplate(user.name)
            });
        } catch (_) { /* non-critical */ }

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        console.error("verifySignUpOTP error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};

const verifyForgotOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and OTP"
            });
        }
        const user = await AuthModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }
        user.forgotOtpVerification = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });
    } catch (error) {
        console.error("verifyForgotOTP error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};

// forgot password (with verified OTP)
const forgotPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const normalizedEmail = normalizeEmail(email);
        if (!newPassword || !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and new password"
            });
        }
        const newPasswordError = validatePassword(newPassword);
        if (newPasswordError) {
            return res.status(400).json({
                success: false,
                message: newPasswordError
            });
        }

        const user = await AuthModel.findOne({ email: normalizedEmail }).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.forgotOtpVerification) {
            return res.status(400).json({
                success: false,
                message: "Please verify your OTP first"
            });
        }

        user.forgotOtpVerification = false;
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Password Reset Successful",
                text: "Your password has been reset successfully.",
                html: resetTemplate(user.name)
            });
        } catch (_) { /* non-critical */ }

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
            data: sanitizeUser(user)
        });
    } catch (error) {
        console.error("forgotPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Password reset failed"
        });
    }
};



const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email"
            });
        }

        const user = await AuthModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if user is already verified
        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        // Check if there's an existing OTP that hasn't expired yet (30-second rate limiting)
        if (user.otpExpiry && user.otpExpiry > new Date()) {
            const timeSinceLastOTP = Date.now() - (user.otpExpiry.getTime() - 3 * 60 * 1000);
            const timeRemaining = Math.max(0, 30 - Math.ceil(timeSinceLastOTP / 1000));

            if (timeRemaining > 0) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${timeRemaining} seconds before requesting a new OTP`
                });
            }
        }

        // Generate new OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes expiry
        await user.save();

        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Resend OTP - Verify your email",
                text: `Your new OTP is ${otp}. It will expire in 3 minutes.`,
                html: otpTemplate(otp)
            });
        } catch (emailError) {
            console.error("Email sending error:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully"
        });
    } catch (error) {
        console.error("resendOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP resend failed"
        });
    }
};

export {
    signUp,
    login,
    resetPassword,
    sendOTP,
    forgotPassword,
    verifySignUpOTP,
    verifyForgotOTP,
    resendOTP
};
