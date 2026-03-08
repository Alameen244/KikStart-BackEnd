
import { Schema, model } from "mongoose";

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
        phone: { type: String, required: true },
        pinCode: { type: String, required: true },
        location: { type: String, required: true },
        role:{
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    {
        timestamps: true
    },


);

const AuthModel = model("auth", authSchema);

export default AuthModel;
