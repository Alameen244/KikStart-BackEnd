import mongoose, { Schema, model } from "mongoose";

const permissionSchema = new Schema(
  {
    module: {
      type: String,
      required: true,
    },
    actions: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  { _id: false },
);

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    permissions: [permissionSchema],
  },
  {
    timestamps: true,
  },
);

const Role = mongoose.models.role || model("role", roleSchema);

export default Role;
