import mongoose from "mongoose";
import { buildImageData } from "../../Jobs/imageValidation.js";
import {
  TESTIMONIAL_SECTION_KEY,
  testimonialSectionModel,
} from "../../models/homeModels/testimonialModel.js";
import { sortByOrderAndCreatedAt } from "../../utils/sorting.js";

const sectionFilter = { singletonKey: TESTIMONIAL_SECTION_KEY };

const sectionDefaults = {
  singletonKey: TESTIMONIAL_SECTION_KEY,
  heading: "Whats Our Client Say",
  subheading: "TESTIMONIALS",
};

const sectionInsertDefaults = {
  singletonKey: TESTIMONIAL_SECTION_KEY,
};

const ensureTestimonialSection = async () => {
  return testimonialSectionModel.findOneAndUpdate(
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

export const getTestimonials = async (req, res) => {
  try {
    const section = await ensureTestimonialSection();
    const sortedTestimonials = sortByOrderAndCreatedAt(
      section.testimonials,
      false
    );

    return res.status(200).json({
      success: true,
      message: "Testimonial section retrieved successfully",
      data: {
        ...section.toObject(),
        testimonials: sortedTestimonials,
      },
    });
  } catch (error) {
    console.error("getTestimonials error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActiveTestimonials = async (req, res) => {
  try {
    const section = await ensureTestimonialSection();

    const activeTestimonials = sortByOrderAndCreatedAt(
      section.testimonials.filter((testimonial) => testimonial.isActive),
      false
    );

    if (activeTestimonials.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active testimonial section found",
        empty: true,
        data: {
          heading: section.heading,
          subheading: section.subheading,
          testimonials: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active testimonials retrieved successfully",
      empty: false,
      data: {
        heading: section.heading,
        subheading: section.subheading,
        testimonials: activeTestimonials,
      },
    });
  } catch (error) {
    console.error("getActiveTestimonials error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createTestimonial = async (req, res) => {
  try {
    const {
      name,
      profession,
      description,
      imageUrl,
      imagePublicId,
      isActive,
      order,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "description is required",
      });
    }
    const testimonialData = {
      name: name.trim(),
      order: typeof order === "number" ? order : 0,
    };

    if (typeof profession === "string") {
      testimonialData.profession = profession.trim();
    }

    if (typeof description === "string") {
      testimonialData.description = description.trim();
    }

    if (typeof isActive === "boolean") {
      testimonialData.isActive = isActive;
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
        testimonialData.image = image;
      }
    }

    const updatedSection = await testimonialSectionModel.findOneAndUpdate(
      sectionFilter,
      {
        $setOnInsert: sectionInsertDefaults,
        $push: { testimonials: testimonialData },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    const createdTestimonial =
      updatedSection.testimonials[updatedSection.testimonials.length - 1];

    return res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: createdTestimonial,
    });
  } catch (error) {
    console.error("createTestimonial error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      profession,
      description,
      imageUrl,
      imagePublicId,
      isActive,
      order,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid testimonial id",
      });
    }

    const updateData = {};

    if (typeof name === "string") {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "name cannot be empty",
        });
      }
      updateData["testimonials.$.name"] = name.trim();
    }

    if (typeof profession === "string") {
      updateData["testimonials.$.profession"] = profession.trim();
    }

    if (typeof description === "string") {
      updateData["testimonials.$.description"] = description.trim();
    }
    if (typeof description === "string" && description.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "description cannot be empty",
      });
    }
    if (typeof isActive === "boolean") {
      updateData["testimonials.$.isActive"] = isActive;
    }

    if (typeof order === "number") {
      updateData["testimonials.$.order"] = order;
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
        updateData["testimonials.$.image"] = image;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    updateData["testimonials.$.updatedAt"] = new Date();

    const updatedSection = await testimonialSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "testimonials._id": id,
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
        message: "Testimonial not found",
      });
    }

    const updatedTestimonial = updatedSection.testimonials.id(id);

    return res.status(200).json({
      success: true,
      message: "Testimonial updated successfully",
      data: updatedTestimonial,
    });
  } catch (error) {
    console.error("updateTestimonial error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid testimonial id",
      });
    }
    // This section document owns embedded testimonials, so we remove by pulling the subdocument.
    const updatedSection = await testimonialSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "testimonials._id": id,
      },
      {
        $pull: {
          testimonials: { _id: id },
        },
      },
      {
        new: true,
      }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("deleteTestimonial error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { heading, subheading, defaultSection } = req.body;
    const updateData = {};

    if (defaultSection === true) {
      const section = await testimonialSectionModel.findOneAndUpdate(
        sectionFilter,
        {
          $setOnInsert: sectionInsertDefaults,
          $set: {
            heading: sectionDefaults.heading,
            subheading: sectionDefaults.subheading,
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
        message: "No value was given. Default values have been applied to the testimonial section.",
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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "heading or subheading is required",
      });
    }

    const section = await testimonialSectionModel.findOneAndUpdate(
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
      message: "Testimonial section updated successfully",
      data: section,
    });
  } catch (error) {
    console.error("updateSection error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
