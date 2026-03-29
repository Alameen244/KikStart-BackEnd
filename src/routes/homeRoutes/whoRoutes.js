import express from "express";
import {
  createWho,
  deleteWho,
  getActiveWho,
  getAllWhoForAdmin,
  updateWho,
} from "../../controllers/HomeControllers/whoController.js";

const whoRouter = express.Router();

whoRouter.get("/", getActiveWho);
whoRouter.get("/admin", getAllWhoForAdmin);
whoRouter.post("/", createWho);
whoRouter.put("/:id", updateWho);
whoRouter.delete("/:id", deleteWho);

export default whoRouter;
