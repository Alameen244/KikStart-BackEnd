
import mongoose, { Schema, model } from "mongoose";
import { childrenSchema } from "./childrenModel.js";
import { defaultImageValue, imageSchema } from "./shared/imageSchema.js";

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
        profileImage: {
            type: imageSchema,
            default: defaultImageValue
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
        role: {
            type: String,
            enum: ["user", "admin", "subAdmin"],
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
        },
        subscription: {
            status: {
                type: String,
                enum: ["inactive", "active", "cancelled"],
                default: "inactive"
            },

            plan: {
                type: String,
                enum: ["basic", "professional", "advanced"],
                default: null
            },
            amount:{
                type: Number,
                enum:[19,49,99],
            },

            stripeCustomerId: {
                type: String,
                default: null
            },

            stripeSubscriptionId: {
                type: String,
                default: null
            },

            startDate: {
                type: Date,
                default: null
            },

            endDate: {
                type: Date,
                default: null
            }
        }
    },
    {
        timestamps: true
    },


);

const AuthModel = model("auth", authSchema);

export default AuthModel;
