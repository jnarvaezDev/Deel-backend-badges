import { Request, Response } from "express";
import pool from "../db";
import { questions } from "../data/questions";
import { calculateTier } from "../utils/scoring";
import {
  getVirtualBadgeTemplateId,
  issueVirtualBadge,
} from "../services/virtualbadge.service";

type SubmittedAnswer = {
  questionId: number;
  optionLabel: string;
};

export const submitResults = async (req: Request, res: Response) => {
  try {
    const { answers, name, email } = req.body as {
      answers?: SubmittedAnswer[];
      name?: string;
      email?: string;
    };

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "answers is required" });
    }

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    if (answers.length !== questions.length) {
      return res.status(400).json({ message: "All questions must be answered" });
    }

    let totalScore = 0;

    for (const question of questions) {
      const submitted = answers.find((a) => a.questionId === question.id);

      if (!submitted) {
        return res
          .status(400)
          .json({ message: `Missing answer for question ${question.id}` });
      }

      const selectedOption = question.options.find(
        (opt) => opt.label === submitted.optionLabel
      );

      if (!selectedOption) {
        return res
          .status(400)
          .json({ message: `Invalid option for question ${question.id}` });
      }

      totalScore += selectedOption.points;
    }

    const tier = calculateTier(totalScore);
    const templateId = getVirtualBadgeTemplateId(tier);

    const vb = await issueVirtualBadge({
      templateId,
      email,
      fullName: name,
      metadata: {
        score: totalScore,
        tier,
        answers,
      },
    });

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
        totalScore,
        tier,
        JSON.stringify(answers),
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

    return res.status(200).json({
      id: insertedId,
      score: totalScore,
      tier,
      credentialUrl: vb.validationUrl,
      issuedBy: "virtualbadge",
    });
  } catch (error) {
    console.error("submitResults error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};