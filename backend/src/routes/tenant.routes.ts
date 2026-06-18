import { Router } from "express";
import {
  getTenants,
  getTenant,
  createTenantHandler,
  updateTenantHandler,
  deleteTenantHandler,
} from "../controllers/tenant.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getTenants));
router.get("/:id", asyncHandler(getTenant));
router.post("/", asyncHandler(createTenantHandler));
router.put("/:id", asyncHandler(updateTenantHandler));
router.delete("/:id", asyncHandler(deleteTenantHandler));

export default router;
