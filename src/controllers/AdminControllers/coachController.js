import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import AuthModel from "../../models/authModel.js";
import { programSectionModel } from "../../models/homeModels/programModel.js";
import { sendEmail } from "../../utils/mailer.js";
import { normalizeEmail, generateRandomPassword } from "../../utils/authhelper.js";
import coachWelcomeTemplate from "../../Templates/coachWelcomeTemplate.js";


const PROGRAM_POPULATE_FIELDS = "title description isActive";

const sanitizeCoachPayload = (user) => ({
    id: user?._id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    pinCode: user?.pinCode,
    location: user?.location,
    profileImage: user?.profileImage,
    role: user?.role,
    isVerified: user?.isVerified,
    coachProfile: user?.coachProfile,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
});

// Create a coach account (mirrors createSubAdmin)
const createCoach = async (req, res) => {
    try {
        const { name, email, experience, bio, maxStudents } = req.body;
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

        const newCoach = await AuthModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "coatch",
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
            coachProfile: {
                experience: experience?.trim() || "",
                bio: bio?.trim() || "",
                assingedPrograms: [],
                maxStudents: typeof maxStudents === "number" ? maxStudents : 50,
                isActive: true,
            },
        });

        let emailDelivered = true;
        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Your Kikstart Coach Account",
                text: `Hi ${newCoach.name}, your coach account is ready. Temporary password: ${generatedPassword}`,
                html: coachWelcomeTemplate(newCoach.name, generatedPassword, newCoach.email),
            });
        } catch (mailError) {
            emailDelivered = false;
            console.error("admin createCoach email error:", mailError);
        }

        return res.status(201).json({
            success: true,
            message: emailDelivered
                ? "Coach created successfully"
                : "Coach created, but email could not be sent",
            data: {
                ...sanitizeCoachPayload(newCoach),
                emailDelivered,
            },
        });
    } catch (error) {
        console.error("admin createCoach error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create coach",
        });
    }
};

// List all coaches
const getCoaches = async (req, res) => {
    try {
        const {
            search = "",
            status, // "active" | "inactive"
            programId,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const query = { role: "coatch" };

        if (search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
            ];
        }

        if (status === "active") {
            query["coachProfile.isActive"] = true;
        } else if (status === "inactive") {
            query["coachProfile.isActive"] = false;
        }

        if (programId && mongoose.Types.ObjectId.isValid(programId)) {
            query["coachProfile.assingedPrograms.program"] = programId;
        }

        const allowedSortFields = ["createdAt", "name", "email"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

        const coaches = await AuthModel.find(query)
            .populate("coachProfile.assingedPrograms.program", PROGRAM_POPULATE_FIELDS)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt")
            .sort(sort);

        return res.status(200).json({
            success: true,
            count: coaches.length,
            data: coaches,
        });
    } catch (error) {
        console.error("admin getCoaches error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch coaches" });
    }
};

// Get single coach (detail view / "eye" icon in your table)
const getCoachById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid coach id" });
        }

        const coach = await AuthModel.findOne({ _id: id, role: "coatch" })
            .populate("coachProfile.assingedPrograms.program", PROGRAM_POPULATE_FIELDS)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt");

        if (!coach) {
            return res.status(404).json({ success: false, message: "Coach not found" });
        }

        return res.status(200).json({ success: true, data: coach });
    } catch (error) {
        console.error("admin getCoachById error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch coach" });
    }
};

// Assign one or more programs to a coach (mirrors assignPermissionRole, but many-to-many)
const assignProgramsToCoach = async (req, res) => {
    try {
        const { id } = req.params;
        const { programIds } = req.body; // array of program subdocument _ids
        const assignedByUserId = req.jwtPayload?.id;

        if (!id || !Array.isArray(programIds) || programIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Coach id and a non-empty programIds array are required",
            });
        }

        const invalidId = programIds.find((pid) => !mongoose.Types.ObjectId.isValid(pid));
        if (invalidId) {
            return res.status(400).json({ success: false, message: `Invalid program id: ${invalidId}` });
        }

        const coach = await AuthModel.findOne({ _id: id, role: "coatch" });
        if (!coach) {
            return res.status(404).json({ success: false, message: "Coach not found" });
        }

        // Validate these ids actually exist as subdocuments in the singleton program section
        const section = await programSectionModel.findOne({}, { programs: 1 });
        const existingProgramIds = new Set((section?.programs || []).map((p) => String(p._id)));
        const notFound = programIds.filter((pid) => !existingProgramIds.has(String(pid)));
        if (notFound.length > 0) {
            return res.status(404).json({
                success: false,
                message: `Programs not found: ${notFound.join(", ")}`,
            });
        }

        // Skip programs already assigned to avoid duplicate entries
        const alreadyAssigned = new Set(
            coach.coachProfile.assingedPrograms.map((entry) => String(entry.program)),
        );
        const toAdd = programIds.filter((pid) => !alreadyAssigned.has(String(pid)));

        toAdd.forEach((pid) => {
            coach.coachProfile.assingedPrograms.push({
                program: pid,
                assignedBy: assignedByUserId || null,
                assignedAt: new Date(),
            });
        });

        await coach.save();

        const updatedCoach = await AuthModel.findById(id)
            .populate("coachProfile.assingedPrograms.program", PROGRAM_POPULATE_FIELDS)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt");

        return res.status(200).json({
            success: true,
            message: toAdd.length ? "Programs assigned successfully" : "Programs were already assigned",
            data: updatedCoach,
        });
    } catch (error) {
        console.error("admin assignProgramsToCoach error:", error);
        return res.status(500).json({ success: false, message: "Failed to assign programs" });
    }
};

// Unassign a single program from a coach
const unassignProgramFromCoach = async (req, res) => {
    try {
        const { id, programId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(400).json({ success: false, message: "Invalid id(s)" });
        }

        const coach = await AuthModel.findOneAndUpdate(
            { _id: id, role: "coatch" },
            { $pull: { "coachProfile.assingedPrograms": { program: programId } } },
            { new: true },
        )
            .populate("coachProfile.assingedPrograms.program", PROGRAM_POPULATE_FIELDS)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt");

        if (!coach) {
            return res.status(404).json({ success: false, message: "Coach not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Program unassigned successfully",
            data: coach,
        });
    } catch (error) {
        console.error("admin unassignProgramFromCoach error:", error);
        return res.status(500).json({ success: false, message: "Failed to unassign program" });
    }
};

// Update coach profile fields (experience, bio, maxStudents, isActive, name)
const updateCoachProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, experience, bio, maxStudents, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid coach id" });
        }

        const updateData = {};
        if (typeof name === "string" && name.trim()) updateData.name = name.trim();
        if (typeof experience === "string") updateData["coachProfile.experience"] = experience.trim();
        if (typeof bio === "string") updateData["coachProfile.bio"] = bio.trim();
        if (typeof maxStudents === "number") updateData["coachProfile.maxStudents"] = maxStudents;
        if (typeof isActive === "boolean") updateData["coachProfile.isActive"] = isActive;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields provided for update" });
        }

        const coach = await AuthModel.findOneAndUpdate(
            { _id: id, role: "coatch" },
            { $set: updateData },
            { new: true, runValidators: true },
        )
            .populate("coachProfile.assingedPrograms.program", PROGRAM_POPULATE_FIELDS)
            .select("-password -otp -otpExpiry -forgotOtpVerification -pendingExpiryAt");

        if (!coach) {
            return res.status(404).json({ success: false, message: "Coach not found" });
        }

        return res.status(200).json({ success: true, message: "Coach updated successfully", data: coach });
    } catch (error) {
        console.error("admin updateCoachProfile error:", error);
        return res.status(500).json({ success: false, message: "Failed to update coach" });
    }
};

// Coaches available on a given program (useful later for the user-facing "pick your coach" step)
const getCoachesForProgram = async (req, res) => {
    try {
        const { programId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(400).json({ success: false, message: "Invalid program id" });
        }

        const coaches = await AuthModel.find({
            role: "coatch",
            "coachProfile.isActive": true,
            "coachProfile.assingedPrograms.program": programId,
        }).select("name email profileImage coachProfile.experience coachProfile.bio coachProfile.maxStudents");

        return res.status(200).json({ success: true, count: coaches.length, data: coaches });
    } catch (error) {
        console.error("admin getCoachesForProgram error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch coaches" });
    }
};

export {
    createCoach,
    getCoaches,
    getCoachById,
    assignProgramsToCoach,
    unassignProgramFromCoach,
    updateCoachProfile,
    getCoachesForProgram,
};