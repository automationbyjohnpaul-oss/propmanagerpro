import { Router } from "express";
import {
  getUnits,
  getUnit,
  createUnitHandler,
  updateUnitHandler,
  deleteUnitHandler,
} from "../controllers/unit.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import {
  createUnitSchema,
  updateUnitSchema,
} from "../validators/unit.validator";

const router = Router();

router.get("/", asyncHandler(getUnits));
router.get("/:id", asyncHandler(getUnit));
router.post("/", validate(createUnitSchema), asyncHandler(createUnitHandler));
router.put("/:id", validate(updateUnitSchema), asyncHandler(updateUnitHandler));
router.delete("/:id", asyncHandler(deleteUnitHandler));

export default router;
