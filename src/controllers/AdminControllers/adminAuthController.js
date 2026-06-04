import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import AuthModel from "../../models/authModel.js";
import Role from "../../models/role & permission/RoleAndPermissionModel.js";
import { sendEmail } from "../../utils/mailer.js";
import otpTemplate from "../../Templates/otpTemplate.js";
import resetTemplate from "../../Templates/resetTemplate.js";
import loginSuccessTemplate from "../../Templates/loginSuccessTemplate.js";
import { subAdminWelcomeTemplate } from "../../Templates/subAdminCreateTemplate.js";

const ADMIN_ROLES = ["admin", "subAdmin"];

const normalizeEmail = (email) => email?.trim().toLowerCase();

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
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
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
    if (!/[a-z]/.test(password)) {
        messages.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        messages.push("Password must contain at least one number");
    }
    return messages.join(", ");
};

const signAdminToken = (user) => {
    if (!process.env.SECRET_KEY) {
        throw new Error("SECRET_KEY is not configured");
    }

    return jwt.sign(
        { id: user._id, email: user.email, role: user.role, audience: "admin" },
        process.env.SECRET_KEY,
        { expiresIn: "7d" },
    );
};

const sanitizeUser = (user) => {
    const obj = user?.toObject ? user.toObject() : user;
    if (!obj) return obj;
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpiry;
    delete obj.forgotOtpVerification;
    delete obj.pendingExpiryAt;
    return obj;
};

const sanitizeSubAdminPayload = (user) => ({
    id: user?._id,
    name: user?.name,
    email: user?.email,
    profileImage: user?.profileImage,
    role: user?.role,
    isVerified: user?.isVerified,
    permissionRole: user?.permissionRole,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
});

const findAdminByEmail = async (email, selectPassword = false) => {
    const query = AuthModel.findOne({ email, role: { $in: ADMIN_ROLES } });
    return selectPassword ? query.select("+password") : query;
};

const login = async (req, res) => {
    try {
        const data = req.body;
        const email = normalizeEmail(data.email);
        if (!email || !data.password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        const existingUser = await findAdminByEmail(email, true);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found",
            });
        }

        if (!existingUser.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first",
            });
        }

        const isMatch = await bcrypt.compare(data.password, existingUser.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = signAdminToken(existingUser);
        await sendEmail({
            to: email,
            subject: "Admin Login Successful",
            text: "You have successfully logged in.",
            html: loginSuccessTemplate(existingUser.name, "Admin Panel", existingUser.location || "Unknown"),
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: sanitizeUser(existingUser),
        });
    } catch (error) {
        console.error("admin login error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const data = req.body;
        const email = normalizeEmail(data.email);
        if (!email || !data.newPassword || !data.password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }
        const newPasswordError = validatePassword(data.newPassword);
        if (newPasswordError) {
            return res.status(400).json({
                success: false,
                message: newPasswordError,
            });
        }

        const user = await findAdminByEmail(email, true);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found",
            });
        }

        const isCorrect = await bcrypt.compare(data.password, user.password);
        if (!isCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        const isSame = await bcrypt.compare(data.newPassword, user.password);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be same as old password",
            });
        }

        user.password = await bcrypt.hash(data.newPassword, 10);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
            data: sanitizeUser(user),
        });
    } catch (error) {
        console.error("admin resetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Password reset failed",
        });
    }
};

const sendOTP = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body.email);
        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email",
            });
        }

        const user = await findAdminByEmail(normalizedEmail);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found",
            });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 3 * 60 * 1000);
        user.forgotOtpVerification = false;
        await user.save();

        await sendEmail({
            to: normalizedEmail,
            subject: "Your Admin OTP Code",
            text: `Your OTP is ${otp}. It will expire in 3 minutes.`,
            html: otpTemplate(otp),
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (error) {
        console.error("admin sendOTP error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP sending failed",
        });
    }
};

const verifySignUpOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const normalizedEmail = normalizeEmail(req.body.email);
        if (!normalizedEmail || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and OTP",
            });
        }

        const user = await findAdminByEmail(normalizedEmail);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found",
            });
        }
        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.pendingExpiryAt = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("admin verifySignUpOTP error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP verification failed",
        });
    }
};

const verifyForgotOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const normalizedEmail = normalizeEmail(req.body.email);
        if (!normalizedEmail || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and OTP",
            });
        }

        const user = await findAdminByEmail(normalizedEmail);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found",
            });
        }
        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        user.forgotOtpVerification = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
    } catch (error) {
        console.error("admin verifyForgotOTP error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP verification failed",
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const normalizedEmail = normalizeEmail(req.body.email);
        if (!newPassword || !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and new password",
            });
        }
        const newPasswordError = validatePassword(newPassword);
        if (newPasswordError) {
            return res.status(400).json({
                success: false,
                message: newPasswordError,
            });
        }

        const user = await findAdminByEmail(normalizedEmail, true);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found",
            });
        }

        if (!user.forgotOtpVerification) {
            return res.status(400).json({
                success: false,
                message: "Please verify your OTP first",
            });
        }

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be same as old password",
            });
        }

        user.forgotOtpVerification = false;
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Admin Password Reset Successful",
                text: "Your password has been reset successfully.",
                html: resetTemplate(user.name),
            });
        } catch (_) {
            /* non-critical */
        }

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
            data: sanitizeUser(user),
        });
    } catch (error) {
        console.error("admin forgotPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Password reset failed",
        });
    }
};

const resendOTP = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body.email);

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email",
            });
        }

        const user = await findAdminByEmail(normalizedEmail);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        if (user.otpExpiry && user.otpExpiry > new Date()) {
            const timeSinceLastOTP = Date.now() - (user.otpExpiry.getTime() - 3 * 60 * 1000);
            const timeRemaining = Math.max(0, 30 - Math.ceil(timeSinceLastOTP / 1000));

            if (timeRemaining > 0) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${timeRemaining} seconds before requesting a new OTP`,
                });
            }
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 3 * 60 * 1000);
        await user.save();

        await sendEmail({
            to: normalizedEmail,
            subject: "Resend Admin OTP - Verify your email",
            text: `Your new OTP is ${otp}. It will expire in 3 minutes.`,
            html: otpTemplate(otp),
        });

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully",
        });
    } catch (error) {
        console.error("admin resendOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP resend failed",
        });
    }
};

const me = async (req, res) => {
    try {
        const userId = req.jwtPayload?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user = await AuthModel.findById(userId).populate("permissionRole");
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                phone: user.phone,
                location: user.location,
                role: user.role,
                isVerified: user.isVerified,
                permissionRole: user.permissionRole || null,
            },
        });
    } catch (error) {
        console.error("admin me error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
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
                html: subAdminWelcomeTemplate(newSubAdmin.name, generatedPassword, newSubAdmin.email),
            });
        } catch (mailError) {
            emailDelivered = false;
            console.error("admin createSubAdmin email error:", mailError);
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
        console.error("admin createSubAdmin error:", error);
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
        console.error("admin getSubAdmins error:", error);
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
        console.error("admin assignPermissionRole error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to assign role",
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = "",
            role,
            status,
            subscriptionStatus,
            plan,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // --- Build Filter Query ---
        const query = { isVerified: true };

        // Search by name or email
        if (search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
            ];
        }

        // Role filter: "user" | "admin" | "subAdmin"
        if (role) {
            query.role = role;
        }

        // Account status filter: "active" | "inactive"
        // We derive this from isVerified + pendingExpiryAt (adjust if you have a separate isActive field)
        if (status === "active") {
            query.pendingExpiryAt = null;
        } else if (status === "inactive") {
            query.pendingExpiryAt = { $ne: null };
        }

        // Subscription status filter: "active" | "inactive" | "cancelled"
        if (subscriptionStatus) {
            query["subscription.status"] = subscriptionStatus;
        }

        // Plan filter: "basic" | "professional" | "advanced"
        if (plan) {
            query["subscription.plan"] = plan;
        }

        // --- Build Sort ---
        const allowedSortFields = ["createdAt", "name", "email", "subscription.plan"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortDir = sortOrder === "asc" ? 1 : -1;
        const sort = { [sortField]: sortDir };

        // --- Paginated Query ---
        const [users, total] = await Promise.all([
            AuthModel.find(query)
                .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt")
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            AuthModel.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            message: users.length ? "Users fetched successfully" : "No users found",
            count: users.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: users,
        });
    } catch (error) {
        console.error("admin getAllUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

const exportAllUsers = async (req, res) => {
    try {
        const {
            search = "",
            role,
            status,
            subscriptionStatus,
            plan,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const query = { isVerified: true };

        if (search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
            ];
        }
        if (role) query.role = role;
        if (status === "active") query.pendingExpiryAt = null;
        else if (status === "inactive") query.pendingExpiryAt = { $ne: null };
        if (subscriptionStatus) query["subscription.status"] = subscriptionStatus;
        if (plan) query["subscription.plan"] = plan;

        const allowedSortFields = ["createdAt", "name", "email", "subscription.plan"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

        const users = await AuthModel.find(query)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt")
            .sort(sort);

        return res.status(200).json({
            success: true,
            message: "Users exported successfully",
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error("admin exportAllUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to export users",
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Please provide a user id",
            });
        }

        const user = await AuthModel.findById(id)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        console.error("admin getUserById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
};

const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Please provide a user id",
            });
        }

        const deletedUser = await AuthModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: {
                id: deletedUser._id,
            },
        });
    } catch (error) {
        console.error("admin deleteUserById error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

export {
    login,
    resetPassword,
    sendOTP,
    verifyForgotOTP,
    verifySignUpOTP,
    forgotPassword,
    resendOTP,
    me,
    createSubAdmin,
    getSubAdmins,
    assignPermissionRole,
    getAllUsers,
    exportAllUsers,
    getUserById,
    deleteUserById,
};
