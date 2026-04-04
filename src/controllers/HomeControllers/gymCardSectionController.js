import mongoose from "mongoose";
import {
  GYM_CARD_SECTION_KEY,
  gymCardSectionModel,
} from "../../models/homeModels/gymCardSectionModel.js";
import { sortByOrderAndCreatedAt } from "../../utils/sorting.js";

const sectionFilter = { singletonKey: GYM_CARD_SECTION_KEY };

const sectionDefaults = {
  singletonKey: GYM_CARD_SECTION_KEY,
  heading: "Give the Gift of Gym",
  subheading: "Why Choose Us",
  sectionDescription:
    "Lorem ipsum dolor sit amet consectetur. Vitae elit quam volutpat id. Quisque orci lacinia sit non. Diam et adipiscing proin orci. Eget lorem sit etiam molestie rhoncus non. Ut tincidunt tristique suspendisse arcu ac.",
  homeLimit: 4,
};

const sectionInsertDefaults = {
  singletonKey: GYM_CARD_SECTION_KEY,
};

const ensureSection = async () => {
  return gymCardSectionModel.findOneAndUpdate(
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

export const getGymCards = async (req, res) => {
  try {
    const section = await ensureSection();
    const sortedCards = sortByOrderAndCreatedAt(section.cards, false);

    return res.status(200).json({
      success: true,
      message: "Gym card section retrieved successfully",
      data: {
        ...section.toObject(),
        cards: sortedCards,
      },
    });
  } catch (error) {
    console.error("getGymCards error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActiveGymCards = async (req, res) => {
  try {
    const section = await ensureSection();

    const activeCards = sortByOrderAndCreatedAt(
      section.cards.filter((card) => card.isActive),
      false
    );

    if (activeCards.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active gym cards found",
        empty: true,
        data: {
          heading: section.heading,
          subheading: section.subheading,
          sectionDescription: section.sectionDescription,
          cards: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active gym cards retrieved successfully",
      empty: false,
      data: {
        heading: section.heading,
        subheading: section.subheading,
        sectionDescription: section.sectionDescription,
        cards: activeCards,
      },
    });
  } catch (error) {
    console.error("getActiveGymCards error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActiveHomeCards = async (req, res) => {
  try {
    const section = await ensureSection();
    const cardLimit =
      Number.isInteger(section.homeLimit) && section.homeLimit >= 0
        ? section.homeLimit
        : sectionDefaults.homeLimit;

    const activeCards = sortByOrderAndCreatedAt(
      section.cards.filter((card) => card.isActive),
      false
    ).slice(0, cardLimit);

    if (activeCards.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active gym cards found",
        empty: true,
        data: {
          heading: section.heading,
          subheading: section.subheading,
          sectionDescription: section.sectionDescription,
          cards: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active gym cards retrieved successfully",
      empty: false,
      data: {
        heading: section.heading,
        subheading: section.subheading,
        sectionDescription: section.sectionDescription,
        cards: activeCards,
      },
    });
  } catch (error) {
    console.error("getActiveHomeCards error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createGymCard = async (req, res) => {
  try {
    const { title, description, icon, iconBgColor, isActive, order } = req.body;

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

    if (!icon?.trim()) {
      return res.status(400).json({
        success: false,
        message: "icon is required",
      });
    }

    if (!iconBgColor?.trim()) {
      return res.status(400).json({
        success: false,
        message: "iconBgColor is required",
      });
    }

    const cardData = {
      title: title.trim(),
      description: description.trim(),
      icon: icon.trim(),
      iconBgColor: iconBgColor.trim(),
      order: typeof order === "number" ? order : 0,
    };

    if (typeof isActive === "boolean") {
      cardData.isActive = isActive;
    }

    const updatedSection = await gymCardSectionModel.findOneAndUpdate(
      sectionFilter,
      {
        $setOnInsert: sectionInsertDefaults,
        $push: { cards: cardData },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    const createdCard = updatedSection.cards[updatedSection.cards.length - 1];

    return res.status(201).json({
      success: true,
      message: "Gym card created successfully",
      data: createdCard,
    });
  } catch (error) {
    console.error("createGymCard error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateGymCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, iconBgColor, isActive, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym card id",
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
      updateData["cards.$.title"] = title.trim();
    }

    if (typeof description === "string") {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: "description cannot be empty",
        });
      }
      updateData["cards.$.description"] = description.trim();
    }

    if (typeof icon === "string") {
      if (!icon.trim()) {
        return res.status(400).json({
          success: false,
          message: "icon cannot be empty",
        });
      }
      updateData["cards.$.icon"] = icon.trim();
    }

    if (typeof iconBgColor === "string") {
      if (!iconBgColor.trim()) {
        return res.status(400).json({
          success: false,
          message: "iconBgColor cannot be empty",
        });
      }
      updateData["cards.$.iconBgColor"] = iconBgColor.trim();
    }

    if (typeof isActive === "boolean") {
      updateData["cards.$.isActive"] = isActive;
    }

    if (typeof order === "number") {
      updateData["cards.$.order"] = order;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    updateData["cards.$.updatedAt"] = new Date();

    const updatedSection = await gymCardSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "cards._id": id,
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
        message: "Gym card not found",
      });
    }

    const updatedCard = updatedSection.cards.id(id);

    return res.status(200).json({
      success: true,
      message: "Gym card updated successfully",
      data: updatedCard,
    });
  } catch (error) {
    console.error("updateGymCard error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteGymCard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gym card id",
      });
    }

    const updatedSection = await gymCardSectionModel.findOneAndUpdate(
      {
        ...sectionFilter,
        "cards._id": id,
      },
      {
        $pull: {
          cards: { _id: id },
        },
      },
      {
        new: true,
      }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Gym card not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gym card deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("deleteGymCard error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateGymCardSection = async (req, res) => {
  try {
    const { heading, subheading, sectionDescription, homeLimit, defaultSection } =
      req.body;
    const updateData = {};

    if (defaultSection === true) {
      const section = await gymCardSectionModel.findOneAndUpdate(
        sectionFilter,
        {
          $setOnInsert: sectionInsertDefaults,
          $set: {
            heading: sectionDefaults.heading,
            subheading: sectionDefaults.subheading,
            sectionDescription: sectionDefaults.sectionDescription,
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
        message: "No value was given. Default values have been applied to the gym card section.",
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

    if (typeof sectionDescription === "string") {
      updateData.sectionDescription =
        sectionDescription.trim() || sectionDefaults.sectionDescription;
    }

    if (typeof homeLimit === "number") {
      updateData.homeLimit = homeLimit;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "heading, subheading, sectionDescription or homeLimit is required",
      });
    }

    const section = await gymCardSectionModel.findOneAndUpdate(
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
      message: "Gym card section updated successfully",
      data: section,
    });
  } catch (error) {
    console.error("updateGymCardSection error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
