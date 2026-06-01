import { Router } from "express";
import {
  getUnits,
  getUnit,
  createUnitHandler,
  updateUnitHandler,
  deleteUnitHandler,
} from "../controllers/unit.controller";

const router = Router();

router.get("/", getUnits);
router.get("/:id", getUnit);
router.post("/", createUnitHandler);
router.put("/:id", updateUnitHandler);
router.delete("/:id", deleteUnitHandler);

export default router;
