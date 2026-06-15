import { Router } from "express";
import {
  getProperties,
  getProperty,
  createPropertyHandler,
  updatePropertyHandler,
  archiveProperty,
  restoreProperty, // 👈 Add this
} from "../controllers/property.controller";

const router = Router();

router.get("/", getProperties);
router.get("/:id", getProperty);
router.post("/", createPropertyHandler);
router.put("/:id", updatePropertyHandler);
router.patch("/:id/archive", archiveProperty); // Archive endpoint (soft delete)
router.patch("/:id/restore", restoreProperty); // 👈 Add restore route
// ❌ NO delete endpoint - removed per Phase 3 requirements

export default router;
