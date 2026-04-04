import mongoose from "mongoose";
import { buildImageData } from "../../Jobs/imageValidation.js";
import { defaultImageValue } from "../../models/shared/imageSchema.js";
import {
  FAQ_SECTION_KEY,
  faqSectionModel,
} from "../../models/homeModels/faqSectionModel.js";
import { sortByOrderAndCreatedAt } from "../../utils/sorting.js";

const sectionFilter = { singletonKey: FAQ_SECTION_KEY };

const sectionDefaults = {
  singletonKey: FAQ_SECTION_KEY,
  heading: "Have Questions",
  subheading: "FAQs",
  image: defaultImageValue,
  homeLimit: 4,
};

const sectionInsertDefaults = {
  singletonKey: FAQ_SECTION_KEY,
};

const ensureSection = async () => {
  return faqSectionModel.findOneAndUpdate(
    sectionFilter,
    {
      $setOnInsert: sectionInsertDefaults,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const getFAQs = async (req, res) => {
  try {
    const section = await ensureSection();
    const sortedFAQs = sortByOrderAndCreatedAt(section.faqs, false);

    return res.status(200).json({
      success: true,
      message: "FAQ section retrieved successfully",
      data: {
        ...section.toObject(),
        faqs: sortedFAQs,
      },
    });
  } catch (error) {
    console.error("getFAQs error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActiveFAQs = async (req, res) => {
  try {
    const section = await ensureSection();

    const activeFAQs = sortFAQs(
      section.faqs.filter((faq) => faq.isActive),
      false
    );

    if (activeFAQs.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active FAQs found",
        empty: true,
        data: {
          heading: section.heading,
          subheading: section.subheading,
          image: section.image,
          faqs: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active FAQs retrieved successfully",
      empty: false,
      data: {
        heading: section.heading,
        subheading: section.subheading,
        image: section.image,
        faqs: activeFAQs,
      },
    });
  } catch (error) {
    console.error("getActiveFAQs error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActiveHomeFAQs = async (req, res) => {
  try {
    const section = await ensureSection();
    const faqLimit =
      Number.isInteger(section.homeLimit) && section.homeLimit >= 0
        ? section.homeLimit
        : sectionDefaults.homeLimit;

    const activeFAQs = sortByOrderAndCreatedAt(
      section.faqs.filter((faq) => faq.isActive),
      false
    ).slice(0, faqLimit);

    if (activeFAQs.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active FAQs found",
        empty: true,
        data: {
          heading: section.heading,
          subheading: section.subheading,
          image: section.image,
          faqs: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active FAQs retrieved successfully",
      empty: false,
      data: {
        heading: section.heading,
        subheading: section.subheading,
        image: section.image,
        faqs: activeFAQs,
      },
    });
  } catch (error) {
    console.error("getActiveHomeFAQs error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { question, answer, isActive, order } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }

    if (!answer?.trim()) {
      return res.status(400).json({
        success: false,
        message: "answer is required",
      });
    }

    const faqData = {
      question: question.trim(),
      answer: answer.trim(),
    };

    if (typeof isActive === "boolean") {
      faqData.isActive = isActive;
    }

    if (typeof order === "number") {
      faqData.order = order;
    }

    const updatedSection = await faqSectionModel.findOneAndUpdate(
      sectionFilter,
      {
        $setOnInsert: sectionInsertDefaults,
        $push: { faqs: faqData },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    const createdFAQ = updatedSection.faqs[updatedSection.faqs.length - 1];

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: createdFAQ,
    });
  } catch (error) {
    console.error("createFAQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, isActive, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid FAQ id",
      });
    }

    const updateData = {};

    if (typeof question === "string") {
      if (!question.trim()) {
        return res.status(400).json({
          success: false,
          message: "question cannot be empty",
        });
      }
      updateData["faqs.$.question"] = question.trim();
    }

    if (typeof answer === "string") {
      if (!answer.trim()) {
        return res.status(400).json({
          success: false,
          message: "answer cannot be empty",
        });
      }
      updateData["faqs.$.answer"] = answer.trim();
    }

    if (typeof isActive === "boolean") {
      updateData["faqs.$.isActive"] = isActive;
    }

    if (typeof order === "number") {
      updateData["faqs.$.order"] = order;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    updateData["faqs.$.updatedAt"] = new Date();

    const updatedSection = await faqSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "faqs._id": id,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    const updatedFAQ = updatedSection.faqs.id(id);

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: updatedFAQ,
    });
  } catch (error) {
    console.error("updateFAQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid FAQ id",
      });
    }

    const updatedSection = await faqSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "faqs._id": id,
      },
      {
        $pull: {
          faqs: { _id: id },
        },
      },
      {
        new: true,
      }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("deleteFAQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateFAQSection = async (req, res) => {
  try {
    const {
      heading,
      subheading,
      imageUrl,
      imagePublicId,
      homeLimit,
      defaultSection,
    } = req.body;
    const updateData = {};

    if (defaultSection === true) {
      const section = await faqSectionModel.findOneAndUpdate(
        sectionFilter,
        {
          $setOnInsert: sectionInsertDefaults,
          $set: {
            heading: sectionDefaults.heading,
            subheading: sectionDefaults.subheading,
            image: sectionDefaults.image,
            homeLimit: sectionDefaults.homeLimit,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

      return res.status(200).json({
        success: true,
        message: "No value was given. Default values have been applied to the FAQ section.",
        data: section,
        defaultSection: true,
      });
    }

    if (typeof heading === "string") {
      updateData.heading = heading.trim() || sectionDefaults.heading;
    }

    if (typeof subheading === "string") {
      updateData.subheading = subheading.trim() || sectionDefaults.subheading;
    }

    if (imageUrl !== undefined || imagePublicId !== undefined) {
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

    if (typeof homeLimit === "number") {
      updateData.homeLimit = homeLimit;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "heading, subheading, image or homeLimit is required",
      });
    }

    const section = await faqSectionModel.findOneAndUpdate(
      sectionFilter,
      {
        $setOnInsert: sectionInsertDefaults,
        $set: updateData,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "FAQ section updated successfully",
      data: section,
    });
  } catch (error) {
    console.error("updateFAQSection error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
