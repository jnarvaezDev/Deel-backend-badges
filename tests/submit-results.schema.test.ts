import { describe, expect, it } from "vitest";
import { submitResultsSchema } from "../src/schemas/request.schemas";

const validPayload = {
  email: "dev@acme.com",
  currentCountry: "Argentina",
  badge: "talent",
  intent: {
    interestedInGlobalWork: true,
  },
};

describe("submitResultsSchema", () => {
  it("accepts a payload with required intent and professional email", () => {
    const result = submitResultsSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  it("rejects payload when intent is missing", () => {
    const result = submitResultsSchema.safeParse({
      email: "dev@acme.com",
      currentCountry: "Argentina",
      badge: "talent",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "intent")).toBe(true);
    }
  });

  it("rejects personal email domains", () => {
    const result = submitResultsSchema.safeParse({
      ...validPayload,
      email: "person@gmail.com",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "email")).toBe(true);
    }
  });
});
