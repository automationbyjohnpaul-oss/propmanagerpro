import { Router } from "express";
import {
  getTenants,
  getTenant,
  createTenantHandler,
  updateTenantHandler,
  archiveTenantHandler,
  restoreTenantHandler,
} from "../controllers/tenant.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import {
  createTenantSchema,
  updateTenantSchema,
} from "../validators/tenant.validator";

const router = Router();

router.get("/", asyncHandler(getTenants));

router.get("/:id", asyncHandler(getTenant));

router.post(
  "/",
  validate(createTenantSchema),
  asyncHandler(createTenantHandler),
);

router.put(
  "/:id",
  validate(updateTenantSchema),
  asyncHandler(updateTenantHandler),
);

// ARCHIVE & RESTORE
router.patch("/:id/archive", asyncHandler(archiveTenantHandler));

router.patch("/:id/restore", asyncHandler(restoreTenantHandler));

export default router;
