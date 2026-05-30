import { Router } from "express";
import {
  getTenants,
  getTenant,
  createTenantHandler,
  updateTenantHandler,
  deleteTenantHandler,
} from "../controllers/tenant.controller";

const router = Router();

router.get("/", getTenants);
router.get("/:id", getTenant);
router.post("/", createTenantHandler);
router.put("/:id", updateTenantHandler);
router.delete("/:id", deleteTenantHandler);

export default router;
