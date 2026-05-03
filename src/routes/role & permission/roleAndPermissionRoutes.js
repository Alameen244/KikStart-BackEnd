// routes/permissionRoutes.js
import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../../controllers/Role & Permission/roleAndPermissionController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import isAdmin from "../../middlewares/isAdminMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, isAdmin, createRole);
router.get("/", authMiddleware, isAdmin, getRoles);
router.get("/:id", authMiddleware, isAdmin, getRoleById);
router.put("/:id", authMiddleware, isAdmin, updateRole);
router.delete("/:id", authMiddleware, isAdmin, deleteRole);

export default router;
