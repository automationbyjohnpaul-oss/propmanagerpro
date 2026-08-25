import { Router } from "express";
import {
  getUnits,
  getUnit,
  createUnitHandler,
  updateUnitHandler,
  restoreUnitHandler,
  archiveUnitHandler,
} from "../controllers/unit.controller";

import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import {
  createUnitSchema,
  updateUnitSchema,
} from "../validators/unit.validator";

const router = Router();

// GET all units (by property + optional status)
router.get("/", asyncHandler(getUnits));

// GET single unit
router.get("/:id", asyncHandler(getUnit));

// CREATE unit
router.post("/", validate(createUnitSchema), asyncHandler(createUnitHandler));

// UPDATE unit
router.put("/:id", validate(updateUnitSchema), asyncHandler(updateUnitHandler));

// ARCHIVE unit (soft delete)
router.patch("/:id/archive", asyncHandler(archiveUnitHandler));

// RESTORE archived unit
router.patch("/:id/restore", asyncHandler(restoreUnitHandler));

export default router;
