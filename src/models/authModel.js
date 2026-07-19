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
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    profileImage: {
      type: imageSchema,
      default: defaultImageValue,
    },
    otp: {
      type: String,
    },
    isVerified: { type: Boolean, default: false }, // sign up email verify
    forgotOtpVerification: { type: Boolean, default: false },
    otpExpiry: {
      type: Date,
    },
    pendingExpiryAt: {
      type: Date,
      expires: 0,
      default: null,
    },
    phone: { type: String, default: null },
    pinCode: { type: String, default: null },
    location: { type: String, default: null },
    role: {
      type: String,
      enum: ["user", "admin", "subAdmin", "coatch"],
      default: "user",
    },
    permissionRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "role",
      default: null,
    },
    childrens: {
      type: [childrenSchema],
      default: null,
    },
    coachProfile: {
      experience: {
        type: String,
        trim: true,
        default: "",
      },

      bio: {
        type: String,
        trim: true,
        default: "",
      },

      assingedPrograms: [
        {
          program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProgramSection",
          },
          assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "auth",
          },
          assignedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      maxStudents: {
        type: Number,
        default: 50,
        min: 1,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    subscription: {
      status: {
        type: String,
        enum: ["inactive", "active", "cancelled"],
        default: "inactive",
      },

      plan: {
        type: String,
        enum: ["basic", "professional", "advanced"],
        default: null,
      },
      amount: {
        type: Number,
        default: null,
      },

      stripeCustomerId: {
        type: String,
        default: null,
      },

      stripeSubscriptionId: {
        type: String,
        default: null,
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);
authSchema.index({ email: 1 });
authSchema.index({ role: 1 });
const AuthModel = model("auth", authSchema);

export default AuthModel;
