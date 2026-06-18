import { Router } from "express";
import {
  getTenants,
  getTenant,
  createTenantHandler,
  updateTenantHandler,
  deleteTenantHandler,
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
router.delete("/:id", asyncHandler(deleteTenantHandler));

export default router;
