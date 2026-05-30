import { Router } from "express";
import {
  getProperties,
  createPropertyHandler,
  updatePropertyHandler,
  deletePropertyHandler,
} from "../controllers/property.controller";

const router = Router();

router.get("/", getProperties);
router.post("/", createPropertyHandler);
router.put("/:id", updatePropertyHandler);
router.delete("/:id", deletePropertyHandler);

export default router;
