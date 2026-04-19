import mongoose from "mongoose";
import { defaultImageValue, imageSchema } from "../shared/imageSchema.js";

const PROGRAM_SECTION_KEY = "program-section";

export const programImageSchema = imageSchema;

export const programCardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ProgramDetails: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [programImageSchema],
      validate: {
        validator: function (val) {
          return val.length <= 5;
        },
        message: "Maximum 5 images allowed",
      },
      default: [defaultImageValue],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const programSectionSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: PROGRAM_SECTION_KEY,
      unique: true,
      immutable: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
      default: "Programs",
    },
    subheading: {
      type: String,
      required: true,
      trim: true,
      default: "Programs",
    },

    homeLimit: {
      type: Number,
      default: 4,
    },
    programs: {
      type: [programCardSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const programSectionModel = mongoose.model("ProgramSection", programSectionSchema);

export { PROGRAM_SECTION_KEY, programSectionModel };
