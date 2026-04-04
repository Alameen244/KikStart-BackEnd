import { cloudFolders } from "../constants/cloudFolder.js";
import { uploadOnCloudinary } from "../middlewares/cloudinary.middleware.js";

const getCloudinaryFolder = (folderKey) => cloudFolders[folderKey];

export const uploadSingleImage = async (req, res) => {
  try {
    const folderKey = req.body.folder?.toUpperCase();
    const imageUrl = req.body.imageUrl?.trim();
    const folder = getCloudinaryFolder(folderKey);

    if (!req.file && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      });
    }

    if (!folder) {
      return res.status(400).json({
        success: false,
        message: "Folder is required"
      });
    }

    const result = await uploadOnCloudinary(imageUrl || req.file.path, folder);

    return res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error("uploadSingleImage error:", error);

    return res.status(500).json({
      success: false,
      message: "Image upload failed"
    });
  }
};

export const uploadMultipleImages = async (req, res) => {
  try {
    const folderKey = req.body.folder?.toUpperCase();
    const folder = getCloudinaryFolder(folderKey);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Images are required"
      });
    }

    if (!folder) {
      return res.status(400).json({
        success: false,
        message: "  Folder is required"
      });
    }

    const results = await Promise.all(
      req.files.map((file) => uploadOnCloudinary(file.path, folder))
    );

    return res.json({
      success: true,
      images: results.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id
      }))
    });
  } catch (error) {
    console.error("uploadMultipleImages error:", error);

    return res.status(500).json({
      success: false,
      message: "Images upload failed"
    });
  }
};
