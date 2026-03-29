import { whoModel } from "../../models/homeModels/whoModels.js";
import { buildImageData } from "../../Jobs/imageValidation.js";
import { ensureSingleActive } from "../../utils/ensureSingleActive.js";
import { defaultImages } from "../../constants/defaultImages.js";

export const createWho = async (req, res) => {
  try {
    const {
      subHeading,
      heading,
      description,
      buttonText,
      image1Url,
      image1PublicId,
      image2Url,
      image2PublicId,
      isActive,
    } = req.body;

    if (!subHeading?.trim() || !heading?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "subHeading, heading and description are required",
      });
    }

    const whoData = {
      subHeading: subHeading.trim(),
      heading: heading.trim(),
      description: description.trim(),
    };

    if (typeof buttonText === "string" && buttonText.trim()) {
      whoData.buttonText = buttonText.trim();
    }

    if (typeof isActive === "boolean") {
      whoData.isActive = isActive;
    }
    if (whoData.isActive === true) {
  await ensureSingleActive(whoModel);
}
    if (image1Url !== undefined || image1PublicId !== undefined) {
      if (!image1Url || !image1PublicId) {
        return res.status(400).json({
          success: false,
          message: "Both image1Url and image1PublicId are required",
        });
      }

      const image1 = buildImageData(image1Url, image1PublicId, "image1");
      if (image1?.error) {
        return res.status(400).json({
          success: false,
          message: image1.error,
        });
      }
      if (image1) {
        whoData.image1 = image1;
      }
    }

    if (image2Url !== undefined || image2PublicId !== undefined) {
      if (!image2Url || !image2PublicId) {
        return res.status(400).json({
          success: false,
          message: "Both image2Url and image2PublicId are required",
        });
      }

      const image2 = buildImageData(image2Url, image2PublicId, "image2");
      if (image2?.error) {
        return res.status(400).json({
          success: false,
          message: image2.error,
        });
      }
      if (image2) {
        whoData.image2 = image2;
      }
    }

    const newWho = await whoModel.create(whoData);

    return res.status(201).json({
      success: true,
      message: "Who section created successfully",
      data: newWho,
    });
  } catch (error) {
    console.error("createWho error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllWhoForAdmin = async (req, res) => {
  try {
    const whoSections = await whoModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Who sections retrieved successfully",
      data: whoSections,
    });
  } catch (error) {
    console.error("getAllWhoForAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActiveWho = async (req, res) => {
  try {
    const whoSections = await whoModel
      .find({ isActive: true })
      .sort({ createdAt: -1 });
    const fallbackWho = {
      image1: {
        url: defaultImages.url,
        public_id: defaultImages.public_id,
      },
      image2: {
        url: defaultImages.url,
        public_id: defaultImages.public_id,
      },
      subHeading: "subHeading",
      heading: "Heading",
      description: "description",
      buttonText: "buttonText",
      isActive: true,
    };

    return res.status(200).json({
      success: true,
      message: "Active who sections retrieved successfully",
      data: whoSections.length > 0 ? whoSections : [fallbackWho],
    });
  } catch (error) {
    console.error("getActiveWho error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateWho = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subHeading,
      heading,
      description,
      buttonText,
      image1Url,
      image1PublicId,
      image2Url,
      image2PublicId,
      isActive,
    } = req.body;

    const updateData = {};

    if (typeof subHeading === "string" && subHeading.trim()) {
      updateData.subHeading = subHeading.trim();
    }
    if (typeof heading === "string" && heading.trim()) {
      updateData.heading = heading.trim();
    }
    if (typeof description === "string" && description.trim()) {
      updateData.description = description.trim();
    }
    if (typeof buttonText === "string" && buttonText.trim()) {
      updateData.buttonText = buttonText.trim();
    }
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (image1Url !== undefined || image1PublicId !== undefined) {
      if (!image1Url || !image1PublicId) {
        return res.status(400).json({
          success: false,
          message: "Both image1Url and image1PublicId are required",
        });
      }

      const image1 = buildImageData(image1Url, image1PublicId, "image1");
      if (image1?.error) {
        return res.status(400).json({
          success: false,
          message: image1.error,
        });
      }
      if (image1) {
        updateData.image1 = image1;
      }
    }

    if (image2Url !== undefined || image2PublicId !== undefined) {
      if (!image2Url || !image2PublicId) {
        return res.status(400).json({
          success: false,
          message: "Both image2Url and image2PublicId are required",
        });
      }

      const image2 = buildImageData(image2Url, image2PublicId, "image2");
      if (image2?.error) {
        return res.status(400).json({
          success: false,
          message: image2.error,
        });
      }
      if (image2) {
        updateData.image2 = image2;
      }
    }

    if (updateData.isActive === true) {
      await ensureSingleActive(whoModel, id);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedWho = await whoModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedWho) {
      return res.status(404).json({
        success: false,
        message: "Who section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Who section updated successfully",
      data: updatedWho,
    });
  } catch (error) {
    console.error("updateWho error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteWho = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedWho = await whoModel.findByIdAndDelete(id);

    if (!deletedWho) {
      return res.status(404).json({
        success: false,
        message: "Who section not found",
      });
    }
    //checking the deleted who is active or not
    if (deletedWho.isActive) {
      const latest = await whoModel.findOne().sort({ createdAt: -1 });
      if (latest) {
        latest.isActive = true;
        await latest.save();
      }
    }
    return res.status(200).json({
      success: true,
      message: "Who section deleted successfully",
    });
  } catch (error) {
    console.error("deleteWho error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
