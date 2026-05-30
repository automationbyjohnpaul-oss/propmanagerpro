import { Router } from "express";
import {
  getProperties,
  createPropertyHandler,
} from "../controllers/property.controller";

const router = Router();

router.get("/", getProperties);

router.post("/", createPropertyHandler);

export default router;
