import { Request, Response } from "express";
import { validateAssessment } from "../services/validation.service";

export async function validateResponsesController(
  req: Request,
  res: Response
) {
  try {
    const result = await validateAssessment(req.body);

    return res.json(result);

  } catch (error) {
    console.error("[validation.controller]", error);

    return res.status(500).json({
      level: "high",
      scoreModifier: 1,
      shouldRetry: false,
      notes: "Validation failed. Defaulted to no penalty.",
    });
  }
}