import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
export const initiateCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const safeUnlink = async (filePath) => {
  try {
    if (filePath) await fs.promises.unlink(filePath);
  } catch (err) {
    // ignore delete errors (file may already be removed)
  }
};

const isRemoteUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

export const uploadOnCloudinary = async (source, folder) => {
  try {
    if (!source) throw new Error("Upload source is required");

    const normalizedSource = typeof source === "string" ? source.trim() : source;
    const response = await cloudinary.uploader.upload(normalizedSource, {
      resource_type: "auto",
      folder,
    });

    if (!isRemoteUrl(normalizedSource)) {
      await safeUnlink(normalizedSource);
    }
    return response;
  } catch (error) {
    if (!isRemoteUrl(source)) {
      await safeUnlink(source);
    }
    throw error;
  }
};
