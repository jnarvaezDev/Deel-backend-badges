import { Request, Response } from "express";
import pool from "../db";

export const getVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT name, email, score, tier, created_at, vb_validation_url
       FROM results
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Certification not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("verify error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};