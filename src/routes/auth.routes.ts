import { Router } from "express";
import { linkedinLogin, linkedinCallback } from "../controllers/auth.controller";

const router = Router();

router.get("/linkedin", linkedinLogin);
router.get("/linkedin/callback", linkedinCallback);

export default router;