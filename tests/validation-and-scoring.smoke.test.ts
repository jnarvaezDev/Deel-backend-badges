import { describe, expect, it } from "vitest";
import { validateResponsesSchema } from "../src/schemas/request.schemas";
import { evaluateAssessment } from "../src/utils/scoring";

describe("validation schema smoke", () => {
  it("accepts minimal valid validation payload", () => {
    const result = validateResponsesSchema.safeParse({
      path: "A",
      entryAnswer: "B",
      answers: {
        q1: {
          label: "C",
          points: 2,
        },
      },
      openText: "I have worked with teams in multiple countries and documented async decisions.",
    });

    expect(result.success).toBe(true);
  });
});

describe("evaluateAssessment smoke", () => {
  it("returns badge for strong talent route answers", () => {
    const evaluation = evaluateAssessment({
      route: "talent",
      answers: [
        { questionId: "talent_q1", optionLabel: "D" },
        { questionId: "talent_q2", optionLabel: "D" },
        { questionId: "talent_q3", optionLabel: "D" },
        { questionId: "talent_q4", optionLabel: "B" },
        { questionId: "talent_q5", optionLabel: "C" },
        { questionId: "talent_q6", optionLabel: "D" },
      ],
    });

    expect(evaluation.status).toBe("badge");
    expect(evaluation.tier).toBe("Global Talent");
    expect(evaluation.upgradePathTo).toBe("Global Champion");
  });
});
