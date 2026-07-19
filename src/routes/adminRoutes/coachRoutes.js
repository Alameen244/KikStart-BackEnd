import express from "express";
import {
  assignProgramsToCoach,
  createCoach,
  getCoachById,
  getCoaches,
  getCoachesForProgram,
  unassignProgramFromCoach,
  updateCoachProfile,
  
} from "../../controllers/AdminControllers/coachController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import checkPermission from "../../middlewares/checkPermissionMiddleware.js";
import {deleteUserById} from "../../controllers/AdminControllers/subAdminController.js"

const coachRouter = express.Router();
const deleteCoachById  = deleteUserById
coachRouter.post(
  "/coaches",
  authMiddleware,
  checkPermission("Coach Management", "create"),
  createCoach,
);

coachRouter.get(
  "/coaches",
  authMiddleware,
  checkPermission("Coach Management", "read"),
  getCoaches,
);

// Static path defined BEFORE "/coaches/:id" so it isn't swallowed by the :id param
coachRouter.get(
  "/coaches/program/:programId",
  authMiddleware,
  checkPermission("Coach Management", "read"),
  getCoachesForProgram,
);

coachRouter.get(
  "/coaches/:id",
  authMiddleware,
  checkPermission("Coach Management", "read"),
  getCoachById,
);

coachRouter.put(
  "/coaches/:id",
  authMiddleware,
  checkPermission("Coach Management", "update"),
  updateCoachProfile,
);

coachRouter.put(
  "/coaches/:id/programs",
  authMiddleware,
  checkPermission("Coach Management", "update"),
  assignProgramsToCoach,
);

coachRouter.delete(
  "/coaches/:id/programs/:programId",
  authMiddleware,
  checkPermission("Coach Management", "update"),
  unassignProgramFromCoach,
);

coachRouter.delete(
  "/coaches/:id",
  authMiddleware,
  checkPermission("Coach Management", "delete"),
  deleteCoachById,
);

// Coach deletion reuses the existing generic deleteUserById route:
// DELETE /admin/users/:id (already wired in subAdminRoutes.js, works for any role)

export default coachRouter;