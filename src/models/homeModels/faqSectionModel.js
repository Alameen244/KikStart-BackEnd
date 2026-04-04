import mongoose from "mongoose";
import { defaultImageValue, imageSchema } from "../shared/imageSchema.js";

const FAQ_SECTION_KEY = "faq-section";

export const faqImageSchema = imageSchema;

export const faqItemSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
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

const faqSectionSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: FAQ_SECTION_KEY,
      unique: true,
      immutable: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
      default: "Frequently Asked Questions",
    },
    subheading: {
      type: String,
      required: true,
      trim: true,
      default: "FAQs",
    },
    image: {
      type: faqImageSchema,
      default: defaultImageValue,
    },
    homeLimit: {
      type: Number,
      default: 4,
    },
    faqs: {
      type: [faqItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const faqSectionModel = mongoose.model("FAQSection", faqSectionSchema);

export { FAQ_SECTION_KEY, faqSectionModel };
