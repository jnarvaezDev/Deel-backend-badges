import { Router } from "express";
import { validateResponsesController } from "../controllers/validation.controller";
import { validateBody } from "../middlewares/validate-request";
import { validateResponsesSchema } from "../schemas/request.schemas";

const router = Router();

router.post(
  "/validate-responses",
  validateBody(validateResponsesSchema),
  validateResponsesController
);

export default router;
