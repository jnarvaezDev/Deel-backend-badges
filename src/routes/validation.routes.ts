import { Router } from "express";
import { validateResponsesController } from "../controllers/validation.controller";

const router = Router();

router.post(
  "/validate-responses",
  validateResponsesController
);

export default router;