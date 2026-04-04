import express from "express";
import {
  createGymCard,
  deleteGymCard,
  getActiveHomeCards,
  getActiveGymCards,
  getGymCards,
  updateGymCard,
  updateGymCardSection,
} from "../../controllers/HomeControllers/gymCardSectionController.js";

const gymCardSectionRouter = express.Router();

gymCardSectionRouter.get("/admin", getGymCards);
gymCardSectionRouter.get("/home", getActiveHomeCards);
gymCardSectionRouter.get("/", getActiveGymCards);
gymCardSectionRouter.post("/", createGymCard);
gymCardSectionRouter.put("/", updateGymCardSection);
gymCardSectionRouter.put("/:id", updateGymCard);
gymCardSectionRouter.delete("/:id", deleteGymCard);

export default gymCardSectionRouter;
