import { Router } from "express";
import {
  getUnits,
  getUnit,
  createUnitHandler,
  updateUnitHandler,
  deleteUnitHandler,
} from "../controllers/unit.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getUnits));
router.get("/:id", asyncHandler(getUnit));
router.post("/", asyncHandler(createUnitHandler));
router.put("/:id", asyncHandler(updateUnitHandler));
router.delete("/:id", asyncHandler(deleteUnitHandler));

export default router;
