import mongoose from "mongoose";
import { defaultImages } from "../../constants/defaultImages.js";

export const bannerImageSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            trim: true,
        },
        public_id: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: false }
);

const bannerSchema = new mongoose.Schema(
    {
        singleton: {
        type: String,
        default: "main_banner",
        unique: true
    },
        subHeading: {
            type: String,
            required: true,
            trim: true,
        },
        headings: [
            {
                text: {
                    type: String,
                    required: true,
                    trim: true,
                },
            },
        ],

        description: {
            type: String,
            required: true,
            trim: true,
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
            required: true,
            default: defaultImages.banner,
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
