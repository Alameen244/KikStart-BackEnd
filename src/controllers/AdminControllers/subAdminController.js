import bcrypt from "bcryptjs";
import AuthModel from "../../models/authModel.js";
import Role from "../../models/role & permission/RoleAndPermissionModel.js";
import { sendEmail } from "../../utils/mailer.js";
import { subAdminWelcomeTemplate } from "../../Templates/subAdminCreateTemplate.js";
import { normalizeEmail , generateRandomPassword } from "../../utils/authhelper.js";


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

        const query = { isVerified: true };

        if (search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
            ];
        }

        if (role) {
            query.role = role;
        }

        if (status === "active") {
            query.pendingExpiryAt = null;
        } else if (status === "inactive") {
            query.pendingExpiryAt = { $ne: null };
        }

        if (subscriptionStatus) {
            query["subscription.status"] = subscriptionStatus;
        }

        if (plan) {
            query["subscription.plan"] = plan;
        }

        const allowedSortFields = ["createdAt", "name", "email", "subscription.plan"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortDir = sortOrder === "asc" ? 1 : -1;
        const sort = { [sortField]: sortDir };

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

const updateSubadmin = async (req, res) => {
    try {
        const userId = req.jwtPayload?.id;
        const { name, email } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        const user = await AuthModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.name = name.trim();
        user.email = email.trim();
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: sanitizeUser(user)
        });
    } catch (error) {
        console.error("updateUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};

export {
    createSubAdmin,
    getSubAdmins,
    assignPermissionRole,
    getAllUsers,
    exportAllUsers,
    getUserById,
    deleteUserById,
    updateSubadmin,
};