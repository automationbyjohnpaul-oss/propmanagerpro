import { Router } from "express";
import {
  getLeases,
  getLease,
  createLeaseHandler,
  updateLeaseHandler,
  deleteLeaseHandler,
} from "../controllers/lease.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getLeases));
router.get("/:id", asyncHandler(getLease));
router.post("/", asyncHandler(createLeaseHandler));
router.put("/:id", asyncHandler(updateLeaseHandler));
router.delete("/:id", asyncHandler(deleteLeaseHandler));

export default router;
