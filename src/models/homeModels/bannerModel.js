import mongoose from "mongoose";
import { defaultImageValue, imageSchema } from "../shared/imageSchema.js";

export const bannerImageSchema = imageSchema;

const bannerSchema = new mongoose.Schema(
    {
        subHeading: {
            type: String,  
            required: true,
            trim: true,
            default: "Welcome to our platform",
        },
        headings: [
            {
                text: {
                    type: String,
                    required: true,
                    trim: true,
                    default: "Main heading",
                },
            },
        ],

        description: {
            type: String,
            required: true,
            trim: true,
            default: "Banner description",
        },
        guestButtonText: {
            type: String,
            trim: true,
            default: "SIGN UP NOW",
        },
        authButtonText: {
            type: String,
            trim: true,
            default: "Start your journey",
        },
        image: {
            type: bannerImageSchema,
            default: defaultImageValue,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmpty: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);
const bannerModel = mongoose.model("Banner", bannerSchema);
const bannerImageModel = mongoose.model("BannerImage", bannerImageSchema);


export { bannerImageModel , bannerModel };
