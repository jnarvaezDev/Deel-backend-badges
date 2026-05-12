import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type ValidationPayload = {
    path: "A" | "B" | "C";
    entryAnswer: string;
    answers: Record<
        string,
        {
            label: string;
            points: number;
            flag?: string;
        }
    >;
    openText: string;
};

export async function validateAssessment(
    payload: ValidationPayload
) {
    const systemPrompt = `
You are validating a global work readiness assessment.

Your task:
- detect inconsistencies
- detect exaggeration
- compare answers vs written response
- determine confidence level

HIGH:
- highly specific
- includes concrete examples
- references real situations, regions, workflows, or responsibilities
- demonstrates believable depth of international experience
- clearly aligns with selected answers
- contains meaningful detail beyond generic soft-skills language

MEDIUM:
- generally aligned but vague
- generic corporate wording
- lacks concrete examples
- lacks operational detail
- could apply to almost anyone
- demonstrates limited depth despite strong selected answers

LOW:
- contradictory
- unrealistic
- exaggerated
- inconsistent with selected answers
- claims unsupported seniority or scope
- avoids specifics entirely

IMPORTANT:
Generic statements about teamwork, communication, or learning without concrete examples should NOT be classified as HIGH.

If the selected answers indicate senior or extensive international experience, but the written response remains generic or superficial, classify as MEDIUM.

Return ONLY valid JSON.

Example:
{
  "level": "high",
  "shouldRetry": false,
  "notes": "Responses are highly consistent"
}
`;

    const userPrompt = `
ASSESSMENT PATH:
${payload.path}

ENTRY ANSWER:
${payload.entryAnswer}

ANSWERS:
${JSON.stringify(payload.answers, null, 2)}

OPEN TEXT:
${payload.openText}
`;

    const response = await client.responses.create({
        model: "gpt-4.1-mini",

        input: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userPrompt,
            },
        ],

        text: {
            format: {
                type: "json_schema",
                name: "validation_response",

                schema: {
                    type: "object",

                    additionalProperties: false,

                    properties: {
                        level: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                        },

                        shouldRetry: {
                            type: "boolean",
                        },

                        notes: {
                            type: "string",
                        },
                    },

                    required: [
                        "level",
                        "shouldRetry",
                        "notes",
                    ],
                },
            },
        },
    });

    const parsed = JSON.parse(response.output_text) as {
        level: "high" | "medium" | "low";
        shouldRetry: boolean;
        notes: string;
    };

    const modifierMap = {
        high: 1,
        medium: 0.9,
        low: 0.8,
    };

    return {
        ...parsed,
        scoreModifier: modifierMap[parsed.level],
    };
}