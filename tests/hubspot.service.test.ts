import { describe, expect, it } from "vitest";
import {
  FIELD_MAPPING,
  buildFields,
  getHubspotCountryValue,
  getHubspotIntentValue,
} from "../src/services/hubspot.service";

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
      intent: "badges_intent",
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
        intent: "hiring_global_roles;international_job_opportunities",
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
      {
        name: "badges_intent",
        value: "hiring_global_roles;international_job_opportunities",
      },
    ]);
  });

  it("maps selected intent keys to the exact HubSpot internal values", () => {
    expect(
      getHubspotIntentValue({
        hiringGlobalRoles: true,
        jobOpportunities: true,
        exploring: false,
      })
    ).toBe("hiring_global_roles;international_job_opportunities");

    expect(
      getHubspotIntentValue({
        hiringGlobalRoles: false,
        jobOpportunities: false,
        exploring: true,
      })
    ).toBe("exploring");
  });

  it("omits intent when none are selected or intent is missing", () => {
    expect(getHubspotIntentValue({ hiringGlobalRoles: false })).toBeNull();
    expect(getHubspotIntentValue(null)).toBeNull();

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
        intent: null,
      })
    ).not.toContainEqual(expect.objectContaining({ name: "badges_intent" }));
  });

  it("sends the full country name to HubSpot when the app stores an ISO country code", () => {
    expect(getHubspotCountryValue("AR")).toBe("Argentina");

    expect(
      buildFields({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acme.com",
        created_at: "2026-06-18T12:34:56.789Z",
        current_job_title: "Engineering Manager",
        current_country: "BR",
        score: 93,
        tier: "Global Leader",
        vb_validation_page_url: "https://example.com/verify",
      })
    ).toContainEqual({ name: "headquarters", value: "Brazil" });
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
