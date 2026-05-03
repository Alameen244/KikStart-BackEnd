import express from "express";
import {
  createFAQ,
  deleteFAQ,
  getActiveFAQs,
  getActiveHomeFAQs,
  getFAQs,
  updateFAQ,
  updateFAQSection,
} from "../../controllers/HomeControllers/faqSectionController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";

const faqSectionRouter = express.Router();

faqSectionRouter.get("/admin", authMiddleware, checkPermission("FAQs", "read"), getFAQs);
faqSectionRouter.get("/home", getActiveHomeFAQs);
faqSectionRouter.get("/", getActiveFAQs);
faqSectionRouter.post("/", authMiddleware, checkPermission("FAQs", "create"), createFAQ);
faqSectionRouter.put("/", authMiddleware, checkPermission("FAQs", "update"), updateFAQSection);
faqSectionRouter.put("/:id", authMiddleware, checkPermission("FAQs", "update"), updateFAQ);
faqSectionRouter.delete("/:id", authMiddleware, checkPermission("FAQs", "delete"), deleteFAQ);

export default faqSectionRouter;
