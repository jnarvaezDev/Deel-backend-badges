import { Router } from "express";
import { submitResults, getUserBadges, getCommunityStats } from "../controllers/result.controller";
import { validateBody } from "../middlewares/validate-request";
import { submitResultsSchema } from "../schemas/request.schemas";

const router = Router();

router.post("/", validateBody(submitResultsSchema), submitResults);
router.get("/badges", getUserBadges);
router.get("/community-stats", getCommunityStats);

export default router;
