import mongoose from "mongoose";
import AuthModel from "../models/authModel.js";
import { getChildrenLimit } from "../utils/subscriptionUtils.js";

const getUserIdFromRequest = (req) => req.params.userId || req.jwtPayload?.id;

const buildChildrenData = (body, isUpdate = false) => {
  const childrenData = {};

  if (!isUpdate || body.fullName !== undefined) {
    if (typeof body.fullName !== "string" || !body.fullName.trim()) {
      return { error: "fullName is required" };
    }
    childrenData.fullName = body.fullName.trim();
  }

  if (!isUpdate || body.location !== undefined) {
    if (typeof body.location !== "string" || !body.location.trim()) {
      return { error: "location is required" };
    }
    childrenData.location = body.location.trim();
  }

  if (!isUpdate || body.age !== undefined) {
    if (typeof body.age !== "number" || body.age < 1) {
      return { error: "Valid age is required" };
    }
    childrenData.age = body.age;
  }

  if (body.foodHabit !== undefined) {
    childrenData.foodHabit =
      typeof body.foodHabit === "string" ? body.foodHabit.trim() : body.foodHabit;
  }

  if (body.prolongedDisease !== undefined) {
    childrenData.prolongedDisease =
      typeof body.prolongedDisease === "string"
        ? body.prolongedDisease.trim()
        : body.prolongedDisease;
  }

  if (body.profileImage !== undefined) {
    childrenData.profileImage = body.profileImage;
  }

  if (!isUpdate || body.schoolDetails !== undefined) {
    if (
      !body.schoolDetails ||
      typeof body.schoolDetails.schoolName !== "string" ||
      !body.schoolDetails.schoolName.trim() ||
      typeof body.schoolDetails.schoolLocation !== "string" ||
      !body.schoolDetails.schoolLocation.trim()
    ) {
      return { error: "schoolName and schoolLocation are required" };
    }

    childrenData.schoolDetails = {
      schoolName: body.schoolDetails.schoolName.trim(),
      schoolLocation: body.schoolDetails.schoolLocation.trim(),
    };
  }

  if (!isUpdate || body.waiverAcceptance !== undefined) {
    if (typeof body.waiverAcceptance !== "boolean") {
      return { error: "waiverAcceptance is required" };
    }
    childrenData.waiverAcceptance = body.waiverAcceptance;
  }

  if (body.allergy !== undefined) {
    if (typeof body.allergy !== "object" || body.allergy === null) {
      return { error: "allergy must be an object" };
    }

    const hasAllergy = Boolean(body.allergy.hasAllergy);
    const details =
      typeof body.allergy.details === "string" ? body.allergy.details.trim() : "";

    if (hasAllergy && !details) {
      return { error: "Allergy details are required when hasAllergy is true" };
    }

    childrenData.allergy = {
      hasAllergy,
      details: hasAllergy ? details : "",
    };
  }

  return { childrenData };
};

export const createChildren = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const { childrenData, error } = buildChildrenData(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const user = await AuthModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!Array.isArray(user.childrens)) {
      user.childrens = [];
    }

    const subscription = user.subscription;

    if (!subscription || subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        upgradeRequired: true,
        message: "Active subscription required.",
      });
    }

    const maxChildren = getChildrenLimit(subscription.plan);
    const currentChildren = user.childrens.length;

    // Users may keep/edit existing children after a downgrade, but cannot add over the plan limit.
    if (currentChildren >= maxChildren) {
      return res.status(403).json({
        success: false,
        upgradeRequired: true,
        message: `Your ${subscription.plan} plan allows only ${maxChildren} child profile(s).`,
      });
    }

    user.childrens.push(childrenData);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Children created successfully",
      data: user.childrens[user.childrens.length - 1],
    });
  } catch (error) {
    console.error("createChildren error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create children",
    });
  }
};

export const getAllChildrens = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const user = await AuthModel.findById(userId).select("childrens");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Children fetched successfully",
      data: user.childrens || [],
    });
  } catch (error) {
    console.error("getAllChildrens error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch children",
    });
  }
};

export const getChildrenById = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { childrenId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(childrenId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }

    const user = await AuthModel.findById(userId).select("childrens");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const children = user.childrens?.id(childrenId);
    if (!children) {
      return res.status(404).json({
        success: false,
        message: "Children not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Children fetched successfully",
      data: children,
    });
  } catch (error) {
    console.error("getChildrenById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch children",
    });
  }
};

export const updateChildren = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { childrenId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(childrenId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }

    const { childrenData, error } = buildChildrenData(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    if (Object.keys(childrenData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const user = await AuthModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const children = user.childrens?.id(childrenId);
    if (!children) {
      return res.status(404).json({
        success: false,
        message: "Children not found",
      });
    }

    Object.assign(children, childrenData);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Children updated successfully",
      data: children,
    });
  } catch (error) {
    console.error("updateChildren error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update children",
    });
  }
};

export const deleteChildren = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { childrenId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(childrenId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }

    const user = await AuthModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const children = user.childrens?.id(childrenId);
    if (!children) {
      return res.status(404).json({
        success: false,
        message: "Children not found",
      });
    }

    children.deleteOne();

    if (user.childrens.length === 0) {
      user.childrens = null;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Children deleted successfully",
    });
  } catch (error) {
    console.error("deleteChildren error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete children",
    });
  }
};
