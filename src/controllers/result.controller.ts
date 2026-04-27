import { Request, Response } from "express";
import pool from "../db";
import {
  getVirtualBadgeTemplateId,
  issueVirtualBadge,
} from "../services/virtualbadge.service";

export const submitResults = async (req: Request, res: Response) => {

  try {
    const {
      name,
      email,
      badge,
      score,
      maxScore,
      reason,
      answers
    } = req.body as {
      name?: string;
      email?: string;
      badge?: "talent" | "champion" | "leader" | "none";
      score?: number;
      maxScore?: number;
      reason?: string;
      answers?: Record<string, any>;
    };

    //VALIDACIONES
    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    if (!badge) {
      return res.status(400).json({ message: "badge is required" });
    }

    /**
     *MAPEO DE BADGE → TIER
     */
    const badgeToTierMap: Record<string, string | null> = {
      talent: "Global Talent",
      champion: "Global Champion",
      leader: "Global Leader",
      none: null,
    };

    const tier = badgeToTierMap[badge];

    /**
     *VirtualBadge
     */
    let vb = {
      recipientId: null as string | null,
      certificateId: null as string | null,
      validationUrl: null as string | null,
      raw: null as unknown,
    };

    //SOLO crea badge si aplica
    if (badge !== "none" && tier) {
      const templateId = getVirtualBadgeTemplateId(tier);

      vb = await issueVirtualBadge({
        templateId,
        email,
        fullName: name,
        metadata: {
          score,
          maxScore,
          badge,
          tier,
          reason,
        },
      });
    }

    /**
     *DB
     */
    const resultDb = await pool.query(
      `
      INSERT INTO results (
        name, email, score, tier, answers,
        vb_recipient_id, vb_certificate_id, vb_validation_url, vb_status, vb_raw_response
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
      `,
      [
        name ?? null,
        email,
        score ?? null,
        tier,
        JSON.stringify({
          badge,
          score,
          maxScore,
          reason,
          answers
        }),
        vb.recipientId,
        vb.certificateId,
        vb.validationUrl,
        vb.validationUrl ? "issued" : "pending",
        JSON.stringify(vb.raw),
      ]
    );

    const insertedId = resultDb.rows?.[0]?.id;

    if (!insertedId) {
      return res.status(500).json({ message: "Failed to save result" });
    }

    /**
     *RESPONSE FINAL
     */
    return res.status(200).json({
      id: insertedId,
      /*score,*/
      tier,
      /*status: badge === "none" ? "no_badge" : "badge",*/
      /*reason,*/
      credentialUrl: vb.validationUrl,
      issuedBy: vb.validationUrl ? "virtualbadge" : null,
    });
  } catch (error) {
    console.error("submitResults error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const { email } = req.query as { email?: string };

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        name,
        email,
        score,
        tier,
        vb_validation_url,
        created_at
      FROM results
      WHERE email = $1
      AND tier IS NOT NULL
      ORDER BY created_at DESC
      `,
      [email]
    );

    return res.status(200).json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("getUserBadges error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};