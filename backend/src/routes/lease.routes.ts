import { Router } from "express";
import {
  getLeases,
  getLease,
  createLeaseHandler,
  updateLeaseHandler,
  deleteLeaseHandler,
} from "../controllers/lease.controller";

const router = Router();

router.get("/", getLeases);
router.get("/:id", getLease);
router.post("/", createLeaseHandler);
router.put("/:id", updateLeaseHandler);
router.delete("/:id", deleteLeaseHandler);

export default router;
