import { describe, expect, it } from "vitest";
import { createLeadSchema, submitResultsSchema } from "../src/schemas/request.schemas";

const validPayload = {
  firstName: "Dev",
  lastName: "Acme",
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

  it("accepts explicit employed status with professional email", () => {
    const result = submitResultsSchema.safeParse({
      ...validPayload,
      employmentStatus: "employed",
      email: "person@acme.com",
    });

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

  it("rejects personal email domains for employed users", () => {
    const result = submitResultsSchema.safeParse({
      ...validPayload,
      employmentStatus: "employed",
      email: "person@gmail.com",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "email")).toBe(true);
    }
  });

  it("accepts personal email domains for unemployed users", () => {
    const result = submitResultsSchema.safeParse({
      ...validPayload,
      employmentStatus: "unemployed",
      email: "person@gmail.com",
    });

    expect(result.success).toBe(true);
  });

  it("defaults missing employmentStatus to employed", () => {
    const result = submitResultsSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employmentStatus).toBe("employed");
    }
  });
});

describe("createLeadSchema", () => {
  const validLeadPayload = {
    firstName: "Lead",
    lastName: "User",
    email: "lead@acme.com",
    currentCountry: "Argentina",
  };

  it("rejects personal email domains for employed leads", () => {
    const result = createLeadSchema.safeParse({
      ...validLeadPayload,
      employmentStatus: "employed",
      email: "lead@gmail.com",
    });

    expect(result.success).toBe(false);
  });

  it("accepts personal email domains for unemployed leads", () => {
    const result = createLeadSchema.safeParse({
      ...validLeadPayload,
      employmentStatus: "unemployed",
      email: "lead@gmail.com",
    });

    expect(result.success).toBe(true);
  });
});
