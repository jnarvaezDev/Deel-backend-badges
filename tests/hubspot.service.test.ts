import { describe, expect, it } from "vitest";
import { FIELD_MAPPING, buildFields } from "../src/services/hubspot.service";

describe("hubspot service", () => {
  it("maps fields to the exact HubSpot property names required by the client", () => {
    expect(FIELD_MAPPING).toEqual({
      firstName: "firstname",
      lastName: "lastname",
      email: "email",
      created_at: "badges_created_at",
      current_job_title: "jobtitle",
      current_country: "headquarters",
      score: "badges_score",
      tier: "badges_tier",
      vb_validation_page_url: "badges_validation_page_url",
    });
  });

  it("builds a HubSpot payload with only the supported fields", () => {
    expect(
      buildFields({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acme.com",
        created_at: "2026-06-18T12:34:56.789Z",
        current_job_title: "Engineering Manager",
        current_country: "Argentina",
        score: 93,
        tier: "Global Leader",
        vb_validation_page_url: "https://example.com/verify",
      })
    ).toEqual([
      { name: "firstname", value: "Jane" },
      { name: "lastname", value: "Doe" },
      { name: "email", value: "jane@acme.com" },
      { name: "badges_created_at", value: "2026-06-18T12:34:56.789Z" },
      { name: "jobtitle", value: "Engineering Manager" },
      { name: "headquarters", value: "Argentina" },
      { name: "badges_score", value: "93" },
      { name: "badges_tier", value: "Global Leader" },
      {
        name: "badges_validation_page_url",
        value: "https://example.com/verify",
      },
    ]);
  });

  it("skips null or blank optional values", () => {
    expect(
      buildFields({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acme.com",
        created_at: "2026-06-18T12:34:56.789Z",
        current_job_title: null,
        current_country: "Argentina",
        score: null,
        tier: null,
        vb_validation_page_url: null,
      })
    ).toEqual([
      { name: "firstname", value: "Jane" },
      { name: "lastname", value: "Doe" },
      { name: "email", value: "jane@acme.com" },
      { name: "badges_created_at", value: "2026-06-18T12:34:56.789Z" },
      { name: "headquarters", value: "Argentina" },
    ]);
  });
});
