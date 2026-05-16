import { Router } from "express";
import { submitResults, getUserBadges  } from "../controllers/result.controller";
import { validateBody } from "../middlewares/validate-request";
import { submitResultsSchema } from "../schemas/request.schemas";

const router = Router();

router.post("/", validateBody(submitResultsSchema), submitResults);
router.get("/badges", getUserBadges);

export default router;
