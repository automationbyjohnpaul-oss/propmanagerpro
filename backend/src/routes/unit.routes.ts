import { Router } from "express";
import {
  getUnits,
  createUnitHandler,
  updateUnitHandler,
  deleteUnitHandler,
} from "../controllers/unit.controller";

const router = Router();

router.get("/", getUnits);
router.post("/", createUnitHandler);
router.put("/:id", updateUnitHandler);
router.delete("/:id", deleteUnitHandler);

export default router;
