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

export const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) throw new Error("File path is required");

    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    console.log("File uploaded on Cloudinary:", response.secure_url);

    await safeUnlink(filePath);
    return response;
  } catch (error) {
    await safeUnlink(filePath);
    throw error;
  }
};
