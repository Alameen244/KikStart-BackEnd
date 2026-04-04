import mongoose from "mongoose";
import { buildImageData } from "../../Jobs/imageValidation.js";
import {
  PROGRAM_SECTION_KEY,
  programSectionModel,
} from "../../models/homeModels/programModel.js";
import { sortByOrderAndCreatedAt } from "../../utils/sorting.js";

const sectionFilter = { singletonKey: PROGRAM_SECTION_KEY };

const sectionDefaults = {
  singletonKey: PROGRAM_SECTION_KEY,
  heading: "Frequently Asked Questions",
  subheading: "FAQs",
  homeLimit: 4,
};

const sectionInsertDefaults = {
  singletonKey: PROGRAM_SECTION_KEY,
};

const ensureProgramSection = async () => {
  return programSectionModel.findOneAndUpdate(
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

export const getPrograms = async (req, res) => {
  try {
    const section = await ensureProgramSection();
    const sortedPrograms = sortByOrderAndCreatedAt(section.programs, false);

    return res.status(200).json({
      success: true,
      message: "Program section retrieved successfully",
      data: {
        ...section.toObject(),
        programs: sortedPrograms,
      },
    });
  } catch (error) {
    console.error("getPrograms error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActivePrograms = async (req, res) => {
  try {
    const section = await ensureProgramSection();

    const activePrograms = sortByOrderAndCreatedAt(
      section.programs.filter((program) => program.isActive),
      false
    );

    if (activePrograms.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active programs found",
        empty: true,
        data: {
          heading: section.heading,
          subheading: section.subheading,
          programs: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active programs retrieved successfully",
      empty: false,
      data: {
        heading: section.heading,
        subheading: section.subheading,
        programs: activePrograms,
      },
    });
  } catch (error) {
    console.error("getActivePrograms error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActiveHomePrograms = async (req, res) => {
  try {
    const section = await ensureProgramSection();
    const programLimit =
      Number.isInteger(section.homeLimit) && section.homeLimit >= 0
        ? section.homeLimit
        : sectionDefaults.homeLimit;

    const activePrograms = sortByOrderAndCreatedAt(
      section.programs.filter((program) => program.isActive),
      false
    ).slice(0, programLimit);

    if (activePrograms.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active programs found",
        empty: true,
        data: {
          heading: section.heading,
          subheading: section.subheading,
          programs: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active home programs retrieved successfully",
      empty: false,
      data: {
        heading: section.heading,
        subheading: section.subheading,
        programs: activePrograms,
      },
    });
  } catch (error) {
    console.error("getActiveHomePrograms error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createProgram = async (req, res) => {
  try {
    const {
      title,
      description,
      imageUrl,
      imagePublicId,
      isActive,
      order,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "description is required",
      });
    }

    const programData = {
      title: title.trim(),
      description: description.trim(),
      order: typeof order === "number" ? order : 0,
    };

    if (typeof isActive === "boolean") {
      programData.isActive = isActive;
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
        programData.image = image;
      }
    }

    const updatedSection = await programSectionModel.findOneAndUpdate(
      sectionFilter,
      {
        $setOnInsert: sectionInsertDefaults,
        $push: { programs: programData },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    const createdProgram = updatedSection.programs[updatedSection.programs.length - 1];

    return res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: createdProgram,
    });
  } catch (error) {
    console.error("createProgram error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      imageUrl,
      imagePublicId,
      isActive,
      order,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid program id",
      });
    }

    const updateData = {};

    if (typeof title === "string") {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "title cannot be empty",
        });
      }
      updateData["programs.$.title"] = title.trim();
    }

    if (typeof description === "string") {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: "description cannot be empty",
        });
      }
      updateData["programs.$.description"] = description.trim();
    }

    if (typeof isActive === "boolean") {
      updateData["programs.$.isActive"] = isActive;
    }

    if (typeof order === "number") {
      updateData["programs.$.order"] = order;
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
        updateData["programs.$.image"] = image;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    updateData["programs.$.updatedAt"] = new Date();

    const updatedSection = await programSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "programs._id": id,
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
        message: "Program not found",
      });
    }

    const updatedProgram = updatedSection.programs.id(id);

    return res.status(200).json({
      success: true,
      message: "Program updated successfully",
      data: updatedProgram,
    });
  } catch (error) {
    console.error("updateProgram error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid program id",
      });
    }

    const updatedSection = await programSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "programs._id": id,
      },
      {
        $pull: {
          programs: { _id: id },
        },
      },
      {
        new: true,
      }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Program deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("deleteProgram error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProgramSection = async (req, res) => {
  try {
    const { heading, subheading, homeLimit, defaultSection } = req.body;
    const updateData = {};

    if (defaultSection === true) {
      const section = await programSectionModel.findOneAndUpdate(
        sectionFilter,
        {
          $setOnInsert: sectionInsertDefaults,
          $set: {
            heading: sectionDefaults.heading,
            subheading: sectionDefaults.subheading,
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
        message: "No value was given. Default values have been applied to the program section.",
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

    if (typeof homeLimit === "number") {
      updateData.homeLimit = homeLimit;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "heading, subheading or homeLimit is required",
      });
    }

    const section = await programSectionModel.findOneAndUpdate(
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
      message: "Program section updated successfully",
      data: section,
    });
  } catch (error) {
    console.error("updateProgramSection error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
