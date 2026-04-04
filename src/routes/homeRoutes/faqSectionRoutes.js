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

const faqSectionRouter = express.Router();

faqSectionRouter.get("/admin", getFAQs);
faqSectionRouter.get("/home", getActiveHomeFAQs);
faqSectionRouter.get("/", getActiveFAQs);
faqSectionRouter.post("/", createFAQ);
faqSectionRouter.put("/", updateFAQSection);
faqSectionRouter.put("/:id", updateFAQ);
faqSectionRouter.delete("/:id", deleteFAQ);

export default faqSectionRouter;
