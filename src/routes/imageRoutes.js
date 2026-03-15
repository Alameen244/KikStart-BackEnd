import express from "express";
import {
  uploadMultipleImages,
  uploadSingleImage,
} from "../controllers/imageController.js";
import {
  uploadMultiple,
  uploadSingle,
} from "../middlewares/multer.middleware.js";

const imageRouter = express.Router();

imageRouter.post("/uploadSingle", uploadSingle("image"), uploadSingleImage);
imageRouter.post(
  "/uploadMultiple",
  uploadMultiple("images", 10),
  uploadMultipleImages
);

export default imageRouter;
