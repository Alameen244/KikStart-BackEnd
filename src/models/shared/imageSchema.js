import mongoose from "mongoose";
import { defaultImages } from "../../constants/defaultImages.js";

const imageSchema = new mongoose.Schema(
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

const defaultImageValue = {
  url: defaultImages.url,
  public_id: defaultImages.public_id,
};

export { imageSchema, defaultImageValue };
