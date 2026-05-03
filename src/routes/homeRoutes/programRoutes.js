import express from "express";
const programRouter = express.Router();
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";

import {
    getPrograms,
    getActivePrograms,
    getActiveHomePrograms,
    updateProgram,
    updateProgramSection,
    deleteProgram,
    createProgram
} from "../../controllers/HomeControllers/ProgramController.js";

programRouter.get("/admin" , authMiddleware, checkPermission("Programs", "read"), getPrograms)
programRouter.get("/" ,getActivePrograms)
programRouter.get("/home", getActiveHomePrograms)
programRouter.post("/", authMiddleware, checkPermission("Programs", "create"), createProgram)
programRouter.put("/:id", authMiddleware, checkPermission("Programs", "update"), updateProgram)
programRouter.put("/", authMiddleware, checkPermission("Programs", "update"), updateProgramSection)
programRouter.delete("/:id", authMiddleware, checkPermission("Programs", "delete"), deleteProgram)

export default programRouter;
