import express from "express";
import {
  createWho,
  deleteWho,
  getActiveWho,
  getAllWhoForAdmin,
  updateWho,
} from "../../controllers/HomeControllers/whoController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";

const whoRouter = express.Router();

whoRouter.get("/", getActiveWho);
whoRouter.get("/admin", authMiddleware, checkPermission("Home Content", "read"), getAllWhoForAdmin);
whoRouter.post("/", authMiddleware, checkPermission("Home Content", "create"), createWho);
whoRouter.put("/:id", authMiddleware, checkPermission("Home Content", "update"), updateWho);
whoRouter.delete("/:id", authMiddleware, checkPermission("Home Content", "delete"), deleteWho);

export default whoRouter;
