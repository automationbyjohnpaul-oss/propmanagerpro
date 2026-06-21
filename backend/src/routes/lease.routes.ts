import { Router } from "express";
import {
  getLeases,
  getLease,
  createLeaseHandler,
  updateLeaseHandler,
  deleteLeaseHandler,
  activateLeaseHandler,
  terminateLeaseHandler,
  restoreLeaseHandler,
  endLeaseHandler,
} from "../controllers/lease.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getLeases));
router.get("/:id", asyncHandler(getLease));
router.post("/", asyncHandler(createLeaseHandler));
router.put("/:id", asyncHandler(updateLeaseHandler));

// STATE TRANSITIONS
router.patch("/:id/activate", asyncHandler(activateLeaseHandler));
router.patch("/:id/terminate", asyncHandler(terminateLeaseHandler));
router.patch("/:id/restore", asyncHandler(restoreLeaseHandler));
router.patch("/:id/end", asyncHandler(endLeaseHandler));

router.delete("/:id", asyncHandler(deleteLeaseHandler));

export default router;
