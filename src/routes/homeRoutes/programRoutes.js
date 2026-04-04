import express from "express";
const programRouter = express.Router();

import {
    getPrograms,
    getActivePrograms,
    getActiveHomePrograms,
    updateProgram,
    updateProgramSection,
    deleteProgram,
    createProgram
} from "../../controllers/HomeControllers/ProgramController.js";

programRouter.get("/admin" ,getPrograms)
programRouter.get("/" ,getActivePrograms)
programRouter.get("/home", getActiveHomePrograms)
programRouter.post("/",createProgram)
programRouter.put("/:id", updateProgram)
programRouter.put("/",updateProgramSection)
programRouter.delete("/:id", deleteProgram)

export default programRouter;
