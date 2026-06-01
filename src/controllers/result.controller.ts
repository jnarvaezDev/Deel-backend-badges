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
      currentJobTitle,
      jobTitle,
      currentCountry,
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
      currentJobTitle?: string;
      jobTitle?: string;
      currentCountry?: string;
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

    if (!currentCountry) {
      return res.status(400).json({ message: "currentCountry is required" });
    }

    const resolvedCurrentJobTitle = currentJobTitle ?? jobTitle ?? null;

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

    const lastAssessmentResult = await pool.query(
      `
      SELECT created_at
      FROM results
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [email]
    );

    const lastAssessmentDate = lastAssessmentResult.rows?.[0]?.created_at as Date | undefined;

    if (lastAssessmentDate) {
      const nextAvailableDate = new Date(lastAssessmentDate);
      nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 6);

      if (new Date() < nextAvailableDate) {
        return res.status(200).json({
          status: "locked",
          message: "You can only take the assessment once every 6 months.",
          nextAvailableDate: nextAvailableDate.toISOString().slice(0, 10),
        });
      }
    }

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

      const tierDescriptionMap: Record<string, string> = {
        "Global Leader":
          "According to an online assessment where the candidate stands by their own truth, Deel certifies that this professional has experience leading cross-border teams.",
        "Global Champion":
          "According to an online assessment where the candidate stands by their own truth, Deel certifies that this professional has experience working with cross-border teams.",
        "Global Talent":
          "According to an online assessment where the candidate stands by their own truth, Deel certifies that this professional has the necessary qualifications to work with cross-border teams.",
      };

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
          description: tierDescriptionMap[tier],
        },
      });
    }

    /**
     *DB
     */
    const resultDb = await pool.query(
      `
      INSERT INTO results (
        name, email, current_job_title, current_country, score, tier, assessment_data,
        vb_recipient_id, vb_certificate_id, vb_validation_url, vb_status, vb_validation_page_url, identification_number
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id
      `,
      [
        name ?? null,
        email,
        resolvedCurrentJobTitle,
        currentCountry,
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
        current_country,
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
