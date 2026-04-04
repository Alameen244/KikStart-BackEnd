import mongoose from "mongoose";
import { defaultImageValue, imageSchema } from "../shared/imageSchema.js";

const TESTIMONIAL_SECTION_KEY = "testimonial-section";

export const testimonialImageSchema = imageSchema;

export const testimonialItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "client name",
    },
    profession: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "client's message",
    },
    image: {
      type: testimonialImageSchema,
      default: defaultImageValue,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const testimonialSectionSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: TESTIMONIAL_SECTION_KEY,
      unique: true,
      immutable: true,
    },
    heading: {
      type: String,
      trim: true,
      default: "Whats Our Client Say",
    },
    subheading: {
      type: String,
      trim: true,
      default: "TESTIMONIALS",
    },
    testimonials: {
      type: [testimonialItemSchema],
      default: [],
    },
    isEmpty: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const testimonialSectionModel = mongoose.model(
  "TestimonialSection",
  testimonialSectionSchema
);

export { TESTIMONIAL_SECTION_KEY, testimonialSectionModel };
