import { Router } from "express";
import { createLeadController } from "../controllers/lead.controller";
import { validateBody } from "../middlewares/validate-request";
import { createLeadSchema } from "../schemas/request.schemas";

const router = Router();

router.post(
  "/leads",
  validateBody(createLeadSchema),
  createLeadController
);

export default router;
