import mongoose from "mongoose";
import { defaultImages } from "../../constants/defaultImages.js";

export const bannerImageSchema = new mongoose.Schema(
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
        },
    },
    { _id: false }
);

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
            default: {
                url: defaultImages.url,
                public_id: defaultImages.public_id,
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);
const bannerModel = mongoose.model("Banner", bannerSchema);
const bannerImageModel = mongoose.model("BannerImage", bannerImageSchema);


export { bannerImageModel , bannerModel };
