
import mongoose, { Schema, model } from "mongoose";
import { childrenSchema } from "./childrenModel.js";

const authSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            select: false,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        otp: {
            type: String
        },
        isVerified: { type: Boolean, default: false },           // sign up email verify
        forgotOtpVerification: { type: Boolean, default: false },
        otpExpiry: {
            type: Date
        },
        pendingExpiryAt: {
            type: Date,
            expires: 0,
            default: null
        },
        phone: { type: String, default: null },
        pinCode: { type: String, default: null },
        location: { type: String, default: null },
        role:{
            type: String,
            enum: ["user", "admin","subAdmin"],
            default: "user"
        },
        permissionRole: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "role",
            default: null
        },
        childrens: {
            type: [childrenSchema],
            default: null
        }
    },
    {
        timestamps: true
    },


);

const AuthModel = model("auth", authSchema);

export default AuthModel;
