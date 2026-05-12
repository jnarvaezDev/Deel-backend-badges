import { Request, Response } from "express";
import { createOrUpdateLead } from "../services/lead.service";

export async function createLeadController(
  req: Request,
  res: Response
) {
  try {
    await createOrUpdateLead(req.body);

    return res.status(200).json({
      success: true,
    });

  } catch (error) {
    console.error("[lead.controller]", error);

    return res.status(500).json({
      success: false,
    });
  }
}