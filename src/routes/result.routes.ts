import { Router } from "express";
import { submitResults } from "../controllers/result.controller";

const router = Router();

router.post("/", submitResults);

export default router;