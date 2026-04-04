import mongoose from "mongoose";

const GYM_CARD_SECTION_KEY = "gym-card-section";

export const gymCardItemSchema = new mongoose.Schema(
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
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    iconBgColor: {
      type: String,
      required: true,
      trim: true,
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

const gymCardSectionSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: GYM_CARD_SECTION_KEY,
      unique: true,
      immutable: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
      default: "Give the Gift of Gym",
    },
    subheading: {
      type: String,
      required: true,
      trim: true,
      default: "Why Choose Us",
    },
    sectionDescription: {
      type: String,
      required: true,
      trim: true,
      default:
        "Lorem ipsum dolor sit amet consectetur. Vitae elit quam volutpat id. Quisque orci lacinia sit non. Diam et adipiscing proin orci. Eget lorem sit etiam molestie rhoncus non. Ut tincidunt tristique suspendisse arcu ac.",
    },
    homeLimit: {
      type: Number,
      default: 4,
      min: 0,
    },
    cards: {
      type: [gymCardItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const gymCardSectionModel = mongoose.model(
  "GymCardSection",
  gymCardSectionSchema
);

export { GYM_CARD_SECTION_KEY, gymCardSectionModel };
