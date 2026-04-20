import { Router } from "express";
import { submitResults, getUserBadges  } from "../controllers/result.controller";

const router = Router();

router.post("/", submitResults);
router.get("/badges", getUserBadges);

export default router;