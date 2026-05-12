import { Router } from "express";
import { createLeadController } from "../controllers/lead.controller";

const router = Router();

router.post(
  "/leads",
  createLeadController
);

export default router;