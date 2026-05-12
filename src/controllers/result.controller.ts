import { Request, Response } from "express";
import pool from "../db";
import {
  getVirtualBadgeTemplateId,
  issueVirtualBadge,
} from "../services/virtualbadge.service";

export const submitResults = async (req: Request, res: Response) => {
  /*
  return res.status(200).json({
      id: 65,
      tier: 'Global Leader',
      credentialUrl: 'https://www.deel.com/es/deel-vs-competitors/?cq_src=google_ads&cq_cmp=18637706562&cq_term=factorial%20hr&cq_plac=&cq_net=g&cq_plt=gp&campaign_name=latam-t2_acq_searchnonbranded_google_search_competitors--es_all_all&utm_source=google&utm_medium=paid-search&utm_campaign=18637706562&utm_content=194809745912&utm_term=factorial%20hr&hsa_acc=3934198784&hsa_cam=18637706562&hsa_grp=194809745912&hsa_ad=800302934543&hsa_src=g&hsa_tgt=kwd-290221087655&hsa_kw=factorial%20hr&hsa_mt=b&hsa_net=adwords&hsa_ver=3&gad_source=1&gad_campaignid=18637706562&gbraid=0AAAAACWpCBH03NLuHpy_IVxlHXQP4QB22&gclid=Cj0KCQjw2MbPBhCSARIsAP3jP9w1jfDHQihS85u_jCc9hwYMmUJRH4uYcQG4pVycsPD5NPe4KIGKu2IaAr_3EALw_wcB',
      issuedBy: "virtualbadge" ,
      validation_page_url : 'https://www.deel.com/es/deel-vs-competitors/?cq_src=google_ads&cq_cmp=18637706562&cq_term=factorial%20hr&cq_plac=&cq_net=g&cq_plt=gp&campaign_name=latam-t2_acq_searchnonbranded_google_search_competitors--es_all_all&utm_source=google&utm_medium=paid-search&utm_campaign=18637706562&utm_content=194809745912&utm_term=factorial%20hr&hsa_acc=3934198784&hsa_cam=18637706562&hsa_grp=194809745912&hsa_ad=800302934543&hsa_src=g&hsa_tgt=kwd-290221087655&hsa_kw=factorial%20hr&hsa_mt=b&hsa_net=adwords&hsa_ver=3&gad_source=1&gad_campaignid=18637706562&gbraid=0AAAAACWpCBH03NLuHpy_IVxlHXQP4QB22&gclid=Cj0KCQjw2MbPBhCSARIsAP3jP9w1jfDHQihS85u_jCc9hwYMmUJRH4uYcQG4pVycsPD5NPe4KIGKu2IaAr_3EALw_wcB',
      identification_number : '123-456-789l'
    });*/

  try {
    const {
      name,
      email,
      companyName,
      jobTitle,
      badge,
      score,
      maxScore,
      reason,
      answers,
      openText,
      honestyConfirmed,
      intent,

      rawScore,
      adjustedScore,
      aiValidation
    } = req.body as {
      name?: string;
      email?: string;
      companyName?: string;
      jobTitle?: string;
      badge?: "talent" | "champion" | "leader" | "none";
      score?: number;
      maxScore?: number;
      reason?: string;
      answers?: Record<string, any>;
      openText?: string;
      honestyConfirmed?: boolean;
      intent?: Record<string, boolean>;

      rawScore?: number;
      adjustedScore?: number;

      aiValidation?: Record<string, any>;
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
      validation_page_url: null as string | null,
      identification_number: null as string | null,
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
        name, email, company, job, score, tier, assessment_data,
        vb_recipient_id, vb_certificate_id, vb_validation_url, vb_status, vb_validation_page_url, identification_number
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id
      `,
      [
        name ?? null,
        email,
        companyName ?? null,
        jobTitle ?? null,
        score ?? null,
        tier,
        JSON.stringify({
          badge,
          score,
          maxScore,
          reason,
          rawScore,
          adjustedScore,
          answers,
          openText,
          honestyConfirmed,
          intent,
          aiValidation,
        }),
        vb.recipientId,
        vb.certificateId,
        vb.validationUrl,
        vb.validationUrl ? "issued" : "pending",
        vb.validation_page_url,
        vb.identification_number
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
      validation_page_url: vb.validation_page_url,
      identification_number: vb.identification_number
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