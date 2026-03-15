import { bannerModel } from "../../models/homeModels/bannerModel.js";
import { v2 as cloudinary } from "cloudinary";
import ImageTrash from "../../models/imageTrashModel.js";

//validate image url
const isValidImageUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};
const isCloudinaryUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.hostname.includes("cloudinary.com");
  } catch {
    return false;
  }
};
//create banner
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
    } = req.body;
    // validaing heading and description length is good practice
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

    if (!Array.isArray(headings) || headings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one heading is required"
      });
    }
    const filteredHeadings = headings
      .filter(h => typeof h.text === "string" && h.text.trim())
      .map(h => ({ text: h.text.trim() }));


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
    if (imageUrl) {
      if (typeof imageUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image url must be a string",
        });
      }
      const trimmedImageUrl = imageUrl.trim();
      if (!isValidImageUrl(trimmedImageUrl)) {
        return res.status(400).json({
          success: false,
          message: "Image url must be a valid http or https URL",
        });
      }

      if (!isCloudinaryUrl(trimmedImageUrl)) {
        return res.status(400).json({
          success: false,
          message: "Image must be a Cloudinary URL"
        });
      }

      if (typeof imagePublicId !== "string" || !imagePublicId.trim()) {
        return res.status(400).json({
          success: false,
          message: "Image public_id must be a non-empty string when image is provided",
        });
      }

      bannerData.image = {
        url: trimmedImageUrl,
        public_id: imagePublicId.trim(),
      };
    }

    const existingBanner = await bannerModel.findOne();

    if (existingBanner) {
      return res.status(400).json({
        success: false,
        message: "Banner already exists. Use update instead.",
      });
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Banner already exists"
      });
    }
    console.error("createBanner error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

//addHeading
export const addHeading = async (req, res) => {
  try {

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Heading text required"
      });
    }

    const banner = await bannerModel.findOneAndUpdate(
      {},
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

export const deleteBannerImage = async (req, res) => {
  try {

    const banner = await bannerModel.findOne();

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    if (!banner.image?.public_id) {
      return res.status(400).json({
        success: false,
        message: "No image to delete"
      });
    }

    const oldPublicId = banner.image.public_id;

    const fileName = oldPublicId.split("/").pop();

    const trashPublicId = `banners_trash/${Date.now()}_${fileName}`;

    // move image to trash folder
    await cloudinary.uploader.rename(oldPublicId, trashPublicId);

    // store for delayed deletion
    await ImageTrash.create({
      public_id: trashPublicId,
      deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // remove image reference from banner
    banner.image = undefined;
    await banner.save();

    return res.status(200).json({
      success: true,
      message: "Banner image moved to trash successfully"
    });

  } catch (error) {

    console.error("deleteBannerImage error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getBanner = async (req, res) => {
  try {
    const banner = await bannerModel.findOne();
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not available",
        data: []
      });
    }
    res.status(200).json({
      success: true,
      message: "Banner retrieved successfully",
      data: banner
    });
  }catch (error) {
    console.error("getBanner error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
export const deleteBanner = async (req, res) => {
  try {

    const banner = await bannerModel.findOne();

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "There is no banner to delete"
      });
    }

    if (banner.image?.public_id) {

      const oldPublicId = banner.image.public_id;
      const fileName = oldPublicId.split("/").pop();
      const trashPublicId = `banners_trash/${Date.now()}_${fileName}`;

      await cloudinary.uploader.rename(oldPublicId, trashPublicId);

      await ImageTrash.create({
        public_id: trashPublicId,
        deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    await bannerModel.findByIdAndDelete(banner._id);

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
export const updateBanner = async (req, res) => {
  try {
    const { headings, subHeading, description, authButtonText, guestButtonText, imageUrl, imagePublicId } = req.body;
    const banner = await bannerModel.findOne();
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "There is no banner to update"
      });
    }

    const updateData = {};
    if (imageUrl) {
      if (typeof imageUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image url must be a string",
        });
      }
      const trimmedImageUrl = imageUrl.trim();
      if (!isValidImageUrl(trimmedImageUrl)) {
        return res.status(400).json({
          success: false,
          message: "Image url must be a valid http or https URL",
        });
      }

      if (!isCloudinaryUrl(trimmedImageUrl)) {
        return res.status(400).json({
          success: false,
          message: "Image must be a Cloudinary URL"
        });
      }

      if (typeof imagePublicId !== "string" || !imagePublicId.trim()) {
        return res.status(400).json({
          success: false,
          message: "Image public_id must be a non-empty string when image is provided",
        });
      }

      const oldPublicId = banner.image?.public_id;
      if (oldPublicId) {
        const fileName = oldPublicId.split("/").pop();
        const trashPublicId = `banners_trash/${Date.now()}_${fileName}`;

        await cloudinary.uploader.rename(oldPublicId, trashPublicId);

        await ImageTrash.create({
          public_id: trashPublicId,
          deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
      updateData.image = {
        url: trimmedImageUrl,
        public_id: imagePublicId.trim(),
      };
    }
    if (subHeading && subHeading.trim() !== "") {
      updateData.subHeading = subHeading.trim();
    }
    if (Array.isArray(headings)) {

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
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const updatedBanner = await bannerModel.findByIdAndUpdate(banner._id, { $set: updateData }, { new: true , runValidators: true });
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
