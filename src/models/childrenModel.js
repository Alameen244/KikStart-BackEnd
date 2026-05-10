import mongoose from "mongoose";
import { imageSchema } from "./shared/imageSchema.js";

const schoolDetailsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },

    schoolLocation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);


export const childrenSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 1,
    },

    foodHabit: {
      type: String,
      trim: true,
    },

    // =========================
    // ALLERGY
    // =========================

    allergy: {
      hasAllergy: {
        type: Boolean,
        default: false,
      },

      details: {
        type: String,
        trim: true,

        validate: {
          validator: function (value) {
            // If allergy is true -> details required
            if (this.allergy?.hasAllergy && !value) {
              return false;
            }

            // If allergy is false -> details should NOT exist
            if (!this.allergy?.hasAllergy && value) {
              return false;
            }

            return true;
          },

          message:
            "Allergy details must exist only when hasAllergy is true",
        },
      },
    },

    prolongedDisease: {
      type: String,
      trim: true,
    },

    profileImage: {
      type: imageSchema,
    },

    schoolDetails: {
      type: schoolDetailsSchema,
      required: true,
    },
    waiverAcceptance: {
      type: Boolean,
      default: false,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);


