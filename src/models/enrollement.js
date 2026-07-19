import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },

    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },

    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "COMPLETED",
        "CANCELLED",
        "SUSPENDED"
      ],
      default: "ACTIVE",
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({
  parentId: 1,
  childId: 1,
  programId: 1,
});

enrollmentSchema.index({
  coachId: 1,
});

enrollmentSchema.index({
  programId: 1,
});

export default mongoose.model("Enrollment", enrollmentSchema); 