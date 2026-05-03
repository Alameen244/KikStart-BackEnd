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
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";

const gymCardSectionRouter = express.Router();

gymCardSectionRouter.get("/admin", authMiddleware, checkPermission("Home Content", "read"), getGymCards);
gymCardSectionRouter.get("/home", getActiveHomeCards);
gymCardSectionRouter.get("/", getActiveGymCards);
gymCardSectionRouter.post("/", authMiddleware, checkPermission("Home Content", "create"), createGymCard);
gymCardSectionRouter.put("/", authMiddleware, checkPermission("Home Content", "update"), updateGymCardSection);
gymCardSectionRouter.put("/:id", authMiddleware, checkPermission("Home Content", "update"), updateGymCard);
gymCardSectionRouter.delete("/:id", authMiddleware, checkPermission("Home Content", "delete"), deleteGymCard);

export default gymCardSectionRouter;
