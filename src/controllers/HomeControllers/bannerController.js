import { bannerModel } from "../../models/homeModels/bannerModel.js";
import { v2 as cloudinary } from "cloudinary";
import { buildImageData } from "../../Jobs/imageValidation.js";
import { ensureSingleActive } from "../../utils/ensureSingleActive.js";
// import ImageTrash from "../../models/imageTrashModel.js";
import mongoose from "mongoose";

// Create a new banner document
export const createBanner = async (req, res) => {
  try {
    const {
      subHeading,
      headings,
      description,
      guestButtonText,
      authButtonText,
      imageUrl,
      imagePublicId,
      isActive,
    } = req.body;

    // Reject the request if the required text fields are missing
    if (!subHeading?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "subHeading and description are required",
      });
    }
    const bannerData = {
      subHeading: subHeading.trim(),
      description: description.trim(),
    };

    // At least one heading is required
    if (!Array.isArray(headings) || headings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one heading is required"
      });
    }

    // Remove empty heading values before saving
    const filteredHeadings = headings
      .filter(h => typeof h.text === "string" && h.text.trim())
      .map(h => ({ text: h.text.trim() }));


    // Stop if there are no usable headings after filtering
    if (filteredHeadings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid heading is required"
      });
    }
    bannerData.headings = filteredHeadings;

    if (typeof guestButtonText === "string" && guestButtonText.trim()) {
      bannerData.guestButtonText = guestButtonText.trim();
    }

    if (typeof authButtonText === "string" && authButtonText.trim()) {
      bannerData.authButtonText = authButtonText.trim();
    }

    if (typeof isActive === "boolean") {
      bannerData.isActive = isActive;
    }

    if (bannerData.isActive === true) {
      await ensureSingleActive(bannerModel);
    }

    // Validate the image URL and public_id before saving the image object
    if (imageUrl !== undefined || imagePublicId !== undefined) {
      if (!imageUrl || !imagePublicId) {
        return res.status(400).json({
          success: false,
          message: "Both imageUrl and imagePublicId are required"
        });
      }

      const image = buildImageData(imageUrl, imagePublicId, "image");
      if (image?.error) {
        return res.status(400).json({
          success: false,
          message: image.error,
        });
      }
      if (image) {
        bannerData.image = image;
      }
    }

    const newBanner = await bannerModel.create(bannerData);
    if (!newBanner) {
      return res.status(500).json({
        success: false,
        message: "Failed to create banner"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      banner: newBanner,
    });
  } catch (error) {
    console.error("createBanner error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Add a new heading to the existing banner
export const addHeading = async (req, res) => {
  try {
    const { id } = req.params;

    const { text } = req.body;

    // Reject empty heading text
    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Heading text required"
      });
    }

    // Push the new heading into the banner headings array
    const banner = await bannerModel.findOneAndUpdate(
      { _id: id },
      { $push: { headings: { text: text.trim() } } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    res.json({
      success: true,
      message: "Heading added",
      banner
    });

  } catch (error) {

    console.error("addHeading error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};


export const getAllBannersForAdmin = async (req, res) => {
  try {
    const banners = await bannerModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Banner sections retrieved successfully",
      data: banners
    });
  } catch (error) {
    console.error("getAllBannersForAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getActiveBanner = async (req, res) => {
  try {
    const banners = await bannerModel.find({ isActive: true }).sort({ createdAt: -1 });

    if (banners.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active banner section found",
        empty: true,
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active banner sections retrieved successfully",
      empty: false,
      data: banners
    });
  } catch (error) {
    console.error("getActiveBanner error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete the existing banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid banner id",
          });
        }

    const banner = await bannerModel.findById(id);

    // Check whether a banner exists before deleting it
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    // if (banner.image?.public_id) {

    //   const oldPublicId = banner.image.public_id;
    //   const fileName = oldPublicId.split("/").pop();
    //   const trashPublicId = `banners_trash/${Date.now()}_${fileName}`;

    //   await cloudinary.uploader.rename(oldPublicId, trashPublicId);

    //   await ImageTrash.create({
    //     public_id: trashPublicId,
    //     deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    //   });
    // }

    const deletedBanner = await bannerModel.findByIdAndDelete(id);

    if (deletedBanner.isActive) {
      const latest = await bannerModel.findOne().sort({ createdAt: -1 });
      if (latest) {
        latest.isActive = true;
        await latest.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully"
    });

  } catch (error) {

    console.error("deleteBanner error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

// Update selected fields of the existing banner
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner id",
      });
    }

    const {
      headings,
      subHeading,
      description,
      authButtonText,
      guestButtonText,
      imageUrl,
      imagePublicId,
      isActive,
    } = req.body;
    const banner = await bannerModel.findById(id);

    // A banner must exist before it can be updated
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    const updateData = {};

    // Validate the new image URL before updating the banner image
    if (imageUrl !== undefined || imagePublicId !== undefined) {
      if (!imageUrl || !imagePublicId) {
        return res.status(400).json({
          success: false,
          message: "Both imageUrl and imagePublicId are required"
        });
      }

      const image = buildImageData(imageUrl, imagePublicId, "image");
      if (image?.error) {
        return res.status(400).json({
          success: false,
          message: image.error,
        });
      }
      if (image) {
        updateData.image = image;
      }
    }

    // Only include fields that contain valid update values
    if (subHeading && subHeading.trim() !== "") {
      updateData.subHeading = subHeading.trim();
    }
    if (Array.isArray(headings)) {

      // Keep only valid heading text values
      const filteredHeadings = headings
        .filter(h => typeof h.text === "string" && h.text.trim())
        .map(h => ({ text: h.text.trim() }));


      if (filteredHeadings.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one valid heading is required"
        });
      }
      updateData.headings = filteredHeadings;
    }
    if (description && description.trim() !== "") {
      updateData.description = description.trim();
    }
    if (authButtonText && authButtonText.trim() !== "") {
      updateData.authButtonText = authButtonText.trim();
    }
    if (guestButtonText && guestButtonText.trim() !== "") {
      updateData.guestButtonText = guestButtonText.trim();
    }
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (updateData.isActive === true) {
      await ensureSingleActive(bannerModel, id);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    // Update the banner with the cleaned data
    const updatedBanner = await bannerModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedBanner) {
      return res.status(500).json({
        success: false,
        message: "Failed to update banner"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner
    });
  } catch (error) {
    console.error("updateBanner error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}





// export const deleteBannerImage = async (req, res) => {
//   try {
//     const banner = await bannerModel.findOne();

//     if (!banner) {
//       return res.status(404).json({
//         success: false,
//         message: "Banner not found"
//       });
//     }

//     if (!banner.image?.public_id) {
//       return res.status(400).json({
//         success: false,
//         message: "No image to delete"
//       });
//     }

//     const oldPublicId = banner.image.public_id;

//     const fileName = oldPublicId.split("/").pop();

//     const trashPublicId = `banners_trash/${Date.now()}_${fileName}`;

//     // move image to trash folder
//     await cloudinary.uploader.rename(oldPublicId, trashPublicId);

//     // store for delayed deletion
//     await ImageTrash.create({
//       public_id: trashPublicId,
//       deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//     });

//     remove image reference from banner
//     banner.image = undefined;
//     await banner.save();

//     return res.status(200).json({
//       success: true,
//       message: "Banner image removed successfully"
//     });

//   } catch (error) {
//     console.error("deleteBannerImage error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };
