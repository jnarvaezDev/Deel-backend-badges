import { Router } from "express";
import { createLeadController, getLeadsTableController } from "../controllers/lead.controller";
import { requireInternalApiBearerToken } from "../middlewares/internal-api-bearer";
import { validateBody } from "../middlewares/validate-request";
import { createLeadSchema } from "../schemas/request.schemas";

const router = Router();

router.get("/leads/table", requireInternalApiBearerToken, getLeadsTableController);
router.post(
  "/leads",
  validateBody(createLeadSchema),
  createLeadController
);

export default router;
