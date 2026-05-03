import express from "express";
import {
  createTestimonial,
  deleteTestimonial,
  getActiveTestimonials,
  getTestimonials,
  updateSection,
  updateTestimonial,
} from "../../controllers/HomeControllers/testimonialController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";

const testimonialRouter = express.Router();

testimonialRouter.get("/admin", authMiddleware, checkPermission("Home Content", "read"), getTestimonials);
testimonialRouter.get("/", getActiveTestimonials);
testimonialRouter.post("/", authMiddleware, checkPermission("Home Content", "create"), createTestimonial);
testimonialRouter.put("/", authMiddleware, checkPermission("Home Content", "update"), updateSection);
testimonialRouter.put("/:id", authMiddleware, checkPermission("Home Content", "update"), updateTestimonial);
testimonialRouter.delete("/:id", authMiddleware, checkPermission("Home Content", "delete"), deleteTestimonial);

export default testimonialRouter;
