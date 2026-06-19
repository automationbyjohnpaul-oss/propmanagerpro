import { Router } from "express";
import {
  getUnits,
  getUnit,
  createUnitHandler,
  updateUnitHandler,
  deleteUnitHandler,
  restoreUnitHandler,
} from "../controllers/unit.controller";

import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import {
  createUnitSchema,
  updateUnitSchema,
} from "../validators/unit.validator";

const router = Router();

// ============================================
// UNIT ROUTES (PRODUCTION CLEAN)
// ============================================

// GET all units (by property + optional status)
router.get("/", asyncHandler(getUnits));

// GET single unit
router.get("/:id", asyncHandler(getUnit));

// CREATE unit
router.post("/", validate(createUnitSchema), asyncHandler(createUnitHandler));

// UPDATE unit
router.put("/:id", validate(updateUnitSchema), asyncHandler(updateUnitHandler));

// ============================================
// SOFT DELETE SYSTEM
// ============================================

// DELETE (soft delete via deletedAt)
router.delete("/:id", asyncHandler(deleteUnitHandler));

// RESTORE archived unit
router.patch("/:id/restore", asyncHandler(restoreUnitHandler));

export default router;
