import mongoose from "mongoose";
import Role from "../../models/role & permission/RoleAndPermissionModel.js";
import AuthModel from "../../models/authModel.js";

const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const role = await Role.create({
      name: name.trim().toLowerCase(),
      permissions: permissions || [],
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error("createRole error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create role",
    });
  }
};

const getRoles = async (_req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("getRoles error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("getRoleById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch role",
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    if (!name && !permissions) {
      return res.status(400).json({
        success: false,
        message: "Provide name or permissions to update",
      });
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim().toLowerCase() }),
        ...(permissions && { permissions }),
      },
      { new: true, runValidators: true },
    );

    if (!updatedRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    console.error("updateRole error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Role name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const deletedRole = await Role.findByIdAndDelete(id);

    if (!deletedRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    await AuthModel.updateMany(
      { permissionRole: deletedRole._id },
      { $set: { permissionRole: null } },
    );

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
      data: deletedRole,
    });
  } catch (error) {
    console.error("deleteRole error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete role",
    });
  }
};

export {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
