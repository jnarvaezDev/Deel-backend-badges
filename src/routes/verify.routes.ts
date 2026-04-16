import { Router } from "express";
import { getVerification } from "../controllers/verify.controller";

const router = Router();

router.get("/:id", getVerification);

export default router;