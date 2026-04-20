import { questionsByRoute, RouteKey } from "../data/questions";

type SubmittedAnswer = {
  questionId: string;
  optionLabel: string;
};

type EvaluationInput = {
  route: RouteKey;
  answers: SubmittedAnswer[];
};

export type EvaluationResult = {
  route: RouteKey;
  score: number;
  tier: "Global Talent" | "Global Champion" | "Global Leader" | null;
  status: "badge" | "upgrade_path" | "not_eligible" | "rerouted";
  reroutedTo?: "Global Talent" | "Global Champion";
  upgradePathTo?: "Global Champion" | "Global Leader";
};

const getQuestionPoints = (
  route: RouteKey,
  questionId: string,
  optionLabel: string
): number => {
  const question = questionsByRoute[route].find((q) => q.id === questionId);
  if (!question) return 0;
  const option = question.options.find((o) => o.label === optionLabel);
  return option?.points ?? 0;
};

export const evaluateAssessment = ({
  route,
  answers,
}: EvaluationInput): EvaluationResult => {
  const pointsByQuestion: Record<string, number> = {};

  for (const answer of answers) {
    pointsByQuestion[answer.questionId] = getQuestionPoints(
      route,
      answer.questionId,
      answer.optionLabel
    );
  }

  const score = Object.values(pointsByQuestion).reduce((sum, n) => sum + n, 0);

  if (route === "talent") {
    const q1 = pointsByQuestion["talent_q1"] ?? 0;
    const q6 = pointsByQuestion["talent_q6"] ?? 0;

    if (q1 === 0 && q6 === 0) {
      return { route, score, tier: null, status: "not_eligible" };
    }

    if (score >= 12 && q1 >= 1 && q6 >= 1) {
      return {
        route,
        score,
        tier: "Global Talent",
        status: "badge",
        upgradePathTo: "Global Champion",
      };
    }

    if (score >= 6 && score <= 11) {
      return {
        route,
        score,
        tier: null,
        status: "upgrade_path",
        upgradePathTo: "Global Champion",
      };
    }

    return { route, score, tier: null, status: "not_eligible" };
  }

  if (route === "champion") {
    const q1 = pointsByQuestion["champion_q1"] ?? 0;
    const q2 = pointsByQuestion["champion_q2"] ?? 0;
    const q4 = pointsByQuestion["champion_q4"] ?? 0;

    if (q1 === 0) {
      return {
        route,
        score,
        tier: "Global Talent",
        status: "rerouted",
        reroutedTo: "Global Talent",
        upgradePathTo: "Global Champion",
      };
    }

    if (q4 === 0 || q2 === 0) {
      return { route, score, tier: null, status: "not_eligible" };
    }

    if (score >= 9) {
      return {
        route,
        score,
        tier: "Global Champion",
        status: "badge",
        upgradePathTo: "Global Leader",
      };
    }

    if (score >= 5 && score <= 8) {
      return {
        route,
        score,
        tier: "Global Talent",
        status: "rerouted",
        reroutedTo: "Global Talent",
        upgradePathTo: "Global Champion",
      };
    }

    return { route, score, tier: null, status: "not_eligible" };
  }

  const q1 = pointsByQuestion["leader_q1"] ?? 0;
  const q3 = pointsByQuestion["leader_q3"] ?? 0;

  if (q1 === 0 || q3 === 0) {
    return {
      route,
      score,
      tier: "Global Champion",
      status: "rerouted",
      reroutedTo: "Global Champion",
      upgradePathTo: "Global Leader",
    };
  }

  if (score >= 8 && q1 >= 2 && q3 >= 2) {
    return {
      route,
      score,
      tier: "Global Leader",
      status: "badge",
    };
  }

  if (score >= 4 && score <= 7 && q1 >= 2 && q3 < 2) {
    return {
      route,
      score,
      tier: "Global Champion",
      status: "rerouted",
      reroutedTo: "Global Champion",
      upgradePathTo: "Global Leader",
    };
  }

  return { route, score, tier: null, status: "not_eligible" };
};