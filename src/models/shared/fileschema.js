import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    public_id: {
      type: String,
      required: true,
      trim: true,
    },

    original_filename: {
      type: String,
      default: "",
      trim: true,
    },

    format: {
      type: String,
      default: "",
      trim: true,
    },

    resource_type: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "raw",
    },

    bytes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const defaultFileValue = {
  url: "",
  public_id: "",
  original_filename: "",
  format: "",
  resource_type: "raw",
  bytes: 0,
};

export { fileSchema, defaultFileValue };