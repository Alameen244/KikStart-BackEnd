import mongoose from "mongoose";
import { imageSchema, defaultImageValue } from "../shared/imageSchema.js";
import { fileSchema } from "../shared/fileSchema.js"; // Recommended reusable schema

const coachApplicationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    profileImage: {
      type: imageSchema,
      default: defaultImageValue,
    },

    bio: {
      type: String,
      trim: true,
      default: "",
    },

    experience: {
      type: String,
      trim: true,
      default: "",
    },

    resume: {
      type: fileSchema,
      required: true,
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

coachApplicationSchema.index({ status: 1 });
coachApplicationSchema.index({ email: 1 });

export default mongoose.model("CoachApplication", coachApplicationSchema);