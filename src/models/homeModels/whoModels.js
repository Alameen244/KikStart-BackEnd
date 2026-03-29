import mongoose from "mongoose";
import { defaultImages } from "../../constants/defaultImages.js";

export const whoImageSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            trim: true,
            default: defaultImages.url,
        },
        public_id: {
            type: String,
            trim: true,
            default: defaultImages.public_id,
        }
    },
    { _id: false }
);

const whoSchema = new mongoose.Schema(
    {
        image1: {
            type: whoImageSchema,
            default: {
                url: defaultImages.url,
                public_id: defaultImages.public_id,
            },
        },
        image2: {
            type: whoImageSchema,
            default: {
                url: defaultImages.url,
                public_id: defaultImages.public_id,
            },
        },
        subHeading: {
            type: String,
            required: true,
            trim: true,
            default: "subHeading",
        },
        heading: {
            type: String,
            required: true,
            trim: true,
            default: "heading",
        },
        description: {
            type: String,
            required: true,
            trim: true,
            default: "description",
        },
        buttonText: {
            type: String,
            trim: true,
            default: "buttonText",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const whoModel = mongoose.model("Who", whoSchema);
const whoImageModel = mongoose.model("WhoImage", whoImageSchema);

export { whoImageModel, whoModel };
