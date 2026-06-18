import { Router } from "express";
import {
  getProperties,
  getProperty,
  createPropertyHandler,
  updatePropertyHandler,
  archiveProperty,
  restoreProperty,
} from "../controllers/property.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getProperties));
router.get("/:id", asyncHandler(getProperty));
router.post("/", asyncHandler(createPropertyHandler));
router.put("/:id", asyncHandler(updatePropertyHandler));
router.patch("/:id/archive", asyncHandler(archiveProperty));
router.patch("/:id/restore", asyncHandler(restoreProperty));

export default router;
