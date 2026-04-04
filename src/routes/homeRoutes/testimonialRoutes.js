import express from "express";
import {
  createTestimonial,
  deleteTestimonial,
  getActiveTestimonials,
  getTestimonials,
  updateSection,
  updateTestimonial,
} from "../../controllers/HomeControllers/testimonialController.js";

const testimonialRouter = express.Router();

testimonialRouter.get("/admin", getTestimonials);
testimonialRouter.get("/", getActiveTestimonials);
testimonialRouter.post("/", createTestimonial);
testimonialRouter.put("/", updateSection);
testimonialRouter.put("/:id", updateTestimonial);
testimonialRouter.delete("/:id", deleteTestimonial);

export default testimonialRouter;
