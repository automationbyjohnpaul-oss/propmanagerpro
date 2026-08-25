import { Router } from "express";
import {
  getProperties,
  getProperty,
  createPropertyHandler,
  updatePropertyHandler,
  deletePropertyHandler,
  archiveProperty,
  restoreProperty,
} from "../controllers/property.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../validators/property.validator";

const router = Router();

router.get("/", asyncHandler(getProperties));

router.get("/:id", asyncHandler(getProperty));

router.post(
  "/",
  validate(createPropertySchema),
  asyncHandler(createPropertyHandler),
);

router.put(
  "/:id",
  validate(updatePropertySchema),
  asyncHandler(updatePropertyHandler),
);

router.delete("/:id", asyncHandler(deletePropertyHandler));

router.patch("/:id/archive", asyncHandler(archiveProperty));

router.patch("/:id/restore", asyncHandler(restoreProperty));

export default router;
