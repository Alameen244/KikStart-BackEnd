import mongoose, { Schema, model } from "mongoose";

export const PENDING_ACTION_TYPE = {
  EMAIL_CHANGE: "email_change",
  UNASSIGN_PROGRAM: "unassign_program",
  DELETE_COACH: "delete_coach",
};

const pendingActionSchema = new Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    actionType: {
      type: String,
      enum: Object.values(PENDING_ACTION_TYPE),
      required: true,
    },
    payload: {
      newEmail: { type: String, default: null },
      programId: { type: mongoose.Schema.Types.ObjectId, ref: "ProgramSection", default: null },
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired", "forced"],
      default: "pending",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

pendingActionSchema.index({ coach: 1, status: 1 });  
pendingActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingActionModel = model("pendingAction", pendingActionSchema);