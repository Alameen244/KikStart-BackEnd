
import AuthModel from "../models/authModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { sendEmail } from "../utils/mailer.js";
import otpTemplate from "../Templates/otpTemplate.js";
import resetTemplate from "../Templates/resetTemplate.js";
import loginSuccessTemplate from "../Templates/loginSuccessTemplate.js";
import registerSuccessTemplate from "../Templates/registerSuccessTemplate.js";
import Role from "../models/role & permission/RoleAndPermissionModel.js";
import { subAdminWelcomeTemplate } from "../Templates/subAdminCreateTemplate.js";

const normalizeEmail = (email) => email?.trim().toLowerCase();
const pendingExpiryDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

// generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const all = `${uppercase}${lowercase}${numbers}`;

    let password =
        uppercase[Math.floor(Math.random() * uppercase.length)] +
        lowercase[Math.floor(Math.random() * lowercase.length)] +
        numbers[Math.floor(Math.random() * numbers.length)];

    while (password.length < 10) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
};



const passwordSchema = Joi.string()
    .min(8)
    .pattern(/[A-Z]/)          // At least one uppercase
    .pattern(/[a-z]/)          // At least one lowercase
    .pattern(/[0-9]/)          // At least one number
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
    if (!/[a-z]/.test(password)) {
        messages.push("Password must contain at least one lowercase letter");
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
    return jwt.sign({ id: user._id, email: user.email, role: user.role  }, process.env.SECRET_KEY, { expiresIn: "7d" });
};

const sanitizeUser = (user) => {
    const obj = user?.toObject ? user.toObject() : user;
    if (!obj) return obj;
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpiry;
    delete obj.forgotOtpVerification;
    return obj;
};

const sanitizeSubAdminPayload = (user) => ({
    id: user?._id,
    name: user?.name,
    email: user?.email,
    role: user?.role,
    isVerified: user?.isVerified,
    permissionRole: user?.permissionRole,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
});

// sign-up
const signUp = async (req, res) => {
    try {
        const data = req.body;
        const email = normalizeEmail(data.email);
        const childrens = Array.isArray(data.childrens) ? data.childrens : null;

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
        if (existingUser?.isVerified) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPass = await bcrypt.hash(data.password, 10);
        let user = existingUser;
        if (user && !user.isVerified) {
            return res.status(200).json({
                success: true,
                message: "user already exist but not verified ,OTP resent. Please verify your email."
            });
        }
        else {
            const newUser = await AuthModel.create({
                name: data.name,
                email: email,
                password: hashedPass,
                phone: data.phone,
                pinCode: data.pinCode,
                location: data.location,
                childrens,
                isVerified: false,
                forgotOtpVerification: false,
                pendingExpiryAt: pendingExpiryDate()
            });
            user = newUser;
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 3 * 60 * 1000);
        await user.save();
        // Generate token for immediate login
        const token = signToken(user);


        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email for OTP.",
            data: {
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    childrens: user.childrens
                }
            }
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
        await sendEmail({
            to: email,
            subject: "Login Successful",
            text: "You have successfully logged in.",
            html: loginSuccessTemplate(existingUser.name, "Web", existingUser.location || "Unknown")
        });

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
        user.pendingExpiryAt = undefined;
        await user.save();

        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Welcome to KikStart!",
                text: `Welcome ${user.name}, your account has been verified.`,
                html: registerSuccessTemplate(user.name)
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

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be same as old password"
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
        user.pendingExpiryAt = pendingExpiryDate();
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

const me = async (req, res) => {
    try {
        const userId = req.jwtPayload?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const user = await AuthModel.findById(userId).populate("permissionRole");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }       

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                childrens: user.childrens,
                subscription: user.subscription,
                role: user.role,
                isVerified: user.isVerified,
                permissionRole: user.permissionRole || null,
            }
        });
    } catch (error) {
        console.error("me error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
};

const createSubAdmin = async (req, res) => {
    try {
        const { name, email } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!name?.trim() || !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required",
            });
        }

        const existingUser = await AuthModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const newSubAdmin = await AuthModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "subAdmin",
            isVerified: true,
            phone: null,
            pinCode: null,
            location: null,
            pendingExpiryAt: null,
            otp: undefined,
            otpExpiry: undefined,
            forgotOtpVerification: false,
            permissionRole: null,
            childrens: null,
        });

        let emailDelivered = true;
        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Your Kikstart Subadmin Account",
                text: `Hi ${newSubAdmin.name}, your subadmin account is ready. Temporary password: ${generatedPassword}`,
                html: subAdminWelcomeTemplate(newSubAdmin.name, generatedPassword , newSubAdmin.email),
            });
        } catch (mailError) {
            emailDelivered = false;
            console.error("createSubAdmin email error:", mailError);
        }

        return res.status(201).json({
            success: true,
            message: emailDelivered
                ? "Subadmin created successfully"
                : "Subadmin created, but email could not be sent",
            data: {
                ...sanitizeSubAdminPayload(newSubAdmin),
                emailDelivered,
            },
        });
    } catch (error) {
        console.error("createSubAdmin error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create subadmin",
        });
    }
};

const getSubAdmins = async (_req, res) => {
    try {
        const subAdmins = await AuthModel.find({ role: "subAdmin" })
            .populate("permissionRole")
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: subAdmins.length,
            data: subAdmins,
        });
    } catch (error) {
        console.error("getSubAdmins error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subadmins",
        });
    }
};

const assignPermissionRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionRoleId } = req.body;

        if (!id || !permissionRoleId) {
            return res.status(400).json({
                success: false,
                message: "User id and permissionRoleId are required",
            });
        }

        const role = await Role.findById(permissionRoleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        const subAdmin = await AuthModel.findOneAndUpdate(
            { _id: id, role: "subAdmin" },
            { permissionRole: role._id },
            { new: true },
        )
            .populate("permissionRole")
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt");

        if (!subAdmin) {
            return res.status(404).json({
                success: false,
                message: "Subadmin not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Role assigned successfully",
            data: subAdmin,
        });
    } catch (error) {
        console.error("assignPermissionRole error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to assign role",
        });
    }
};

// get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await AuthModel.find({ isVerified: true })
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: users.length ? "Users fetched successfully" : "No users found",
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error("getAllUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

// get user by id
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Please provide a user id"
            });
        }

        const user = await AuthModel.findById(id)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user
        });
    } catch (error) {
        console.error("getUserById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user"
        });
    }
};

// delete user by id
const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Please provide a user id"
            });
        }

        const deletedUser = await AuthModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: {
                id: deletedUser._id
            }
        });
    } catch (error) {
        console.error("deleteUserById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user"
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
    resendOTP,
    me,
    createSubAdmin,
    getSubAdmins,
    assignPermissionRole,
    getAllUsers,
    getUserById,
    deleteUserById
};
