import { Request, Response } from "express";
import pool from "../db";
import {
  getVirtualBadgeTemplateId,
  issueVirtualBadge,
} from "../services/virtualbadge.service";
import { getHubspotIntentValue, submitToHubspot } from "../services/hubspot.service";
import { fetchResultsTable, parseTablePagination } from "../services/table.service";

const COMMUNITY_STATS_TTL_MS = 60 * 60 * 1000;
const UNEMPLOYED_JOB_TITLE_FALLBACK = "Not applicable";

type CommunityStatsPayload = {
  totalCertified: number;
  byTier: {
    globalTalent: number;
    globalChampion: number;
    globalLeader: number;
  };
  generatedAt: string;
};

let communityStatsCache:
  | {
      value: CommunityStatsPayload;
      expiresAt: number;
    }
  | null = null;

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
      firstName,
      lastName,
      email,
      employmentStatus,
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
      firstName?: string;
      lastName?: string;
      email?: string;
      employmentStatus?: "employed" | "unemployed";
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

    if (!firstName) {
      return res.status(400).json({ message: "firstName is required" });
    }

    if (!lastName) {
      return res.status(400).json({ message: "lastName is required" });
    }

    if (!badge) {
      return res.status(400).json({ message: "badge is required" });
    }

    if (!currentCountry) {
      return res.status(400).json({ message: "currentCountry is required" });
    }

    const resolvedEmploymentStatus = employmentStatus ?? "employed";
    const normalizedCurrentJobTitle = currentJobTitle?.trim() || jobTitle?.trim() || null;
    const resolvedCurrentJobTitle =
      resolvedEmploymentStatus === "unemployed"
        ? normalizedCurrentJobTitle ?? UNEMPLOYED_JOB_TITLE_FALLBACK
        : normalizedCurrentJobTitle;
    const fullName = `${firstName} ${lastName}`.trim();
    const createdAt = new Date().toISOString();

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
      const templateId = getVirtualBadgeTemplateId(tier, currentCountry);

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
        fullName,
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
        name, email, employment_status, current_job_title, current_country, score, tier, assessment_data,
        vb_recipient_id, vb_certificate_id, vb_validation_url, vb_status, vb_validation_page_url, identification_number
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id
      `,
      [
        fullName,
        email,
        resolvedEmploymentStatus,
        resolvedCurrentJobTitle,
        currentCountry,
        score ?? null,
        tier,
        JSON.stringify({
          badge,
          employmentStatus: resolvedEmploymentStatus,
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

    const responsePayload = {
      id: insertedId,
      /*score,*/
      tier,
      /*status: badge === "none" ? "no_badge" : "badge",*/
      /*reason,*/
      credentialUrl: vb.validationUrl,
      issuedBy: vb.validationUrl ? "virtualbadge" : null,
      validation_page_url: vb.validation_page_url,
      identification_number: vb.identification_number
    };

    /**
      *RESPONSE FINAL
      */
    res.status(200).json(responsePayload);

    void (async () => {
      try {
        console.info("HubSpot submission started", {
          email,
          createdAt,
          score: score ?? null,
          tier,
        });

        await submitToHubspot({
          firstName,
          lastName,
          email,
          created_at: createdAt,
          current_job_title: resolvedCurrentJobTitle,
          current_country: currentCountry,
          score: score ?? null,
          tier,
          vb_validation_page_url: vb.validation_page_url,
          intent: getHubspotIntentValue(intent),
        });

        console.info("HubSpot submission succeeded", {
          email,
          createdAt,
          score: score ?? null,
          tier,
        });
      } catch (error) {
        console.error("HubSpot submission failed", {
          email,
          createdAt,
          score: score ?? null,
          tier,
          error,
        });
      }
    })();

    return;
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

export const getCommunityStats = async (_req: Request, res: Response) => {
  try {
    const now = Date.now();

    if (communityStatsCache && communityStatsCache.expiresAt > now) {
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).json({
        ...communityStatsCache.value,
        cache: "hit",
      });
    }

    const result = await pool.query(
      `
      SELECT tier, COUNT(*)::int AS count
      FROM results
      WHERE tier IN ('Global Talent', 'Global Champion', 'Global Leader')
      GROUP BY tier
      `
    );

    const countsByTier = result.rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.tier] = Number(row.count ?? 0);
      return acc;
    }, {});

    const payload: CommunityStatsPayload = {
      totalCertified:
        (countsByTier["Global Talent"] ?? 0) +
        (countsByTier["Global Champion"] ?? 0) +
        (countsByTier["Global Leader"] ?? 0),
      byTier: {
        globalTalent: countsByTier["Global Talent"] ?? 0,
        globalChampion: countsByTier["Global Champion"] ?? 0,
        globalLeader: countsByTier["Global Leader"] ?? 0,
      },
      generatedAt: new Date().toISOString(),
    };

    communityStatsCache = {
      value: payload,
      expiresAt: now + COMMUNITY_STATS_TTL_MS,
    };

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({
      ...payload,
      cache: "miss",
    });
  } catch (error) {
    console.error("getCommunityStats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getResultsTable = async (req: Request, res: Response) => {
  try {
    const pagination = parseTablePagination(req.query.page, req.query.limit);
    const table = await fetchResultsTable(pagination);

    return res.status(200).json(table);
  } catch (error) {
    console.error("getResultsTable error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
