import { Router } from "express";
import {
  getProperties,
  getProperty,
  createPropertyHandler,
  updatePropertyHandler,
  deletePropertyHandler,
} from "../controllers/property.controller";

const router = Router();

router.get("/", getProperties);
router.get("/:id", getProperty);
router.post("/", createPropertyHandler);
router.put("/:id", updatePropertyHandler);
router.delete("/:id", deletePropertyHandler);

export default router;
