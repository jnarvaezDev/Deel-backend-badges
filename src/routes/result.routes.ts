import { Router } from "express";
import {
  submitResults,
  getUserBadges,
  getCommunityStats,
  getResultsTable,
} from "../controllers/result.controller";
import { validateBody } from "../middlewares/validate-request";
import { requireInternalApiBearerToken } from "../middlewares/internal-api-bearer";
import { submitResultsSchema } from "../schemas/request.schemas";

const router = Router();

router.post("/", validateBody(submitResultsSchema), submitResults);
router.get("/table", requireInternalApiBearerToken, getResultsTable);
router.get("/badges", getUserBadges);
router.get("/community-stats", getCommunityStats);

export default router;
