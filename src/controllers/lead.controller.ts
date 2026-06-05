import { Request, Response } from "express";
import { createOrUpdateLead } from "../services/lead.service";
import { fetchLeadsTable, parseTablePagination } from "../services/table.service";

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

export async function getLeadsTableController(req: Request, res: Response) {
  try {
    const pagination = parseTablePagination(req.query.page, req.query.limit);
    const table = await fetchLeadsTable(pagination);

    return res.status(200).json(table);
  } catch (error) {
    console.error("[lead.table.controller]", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
