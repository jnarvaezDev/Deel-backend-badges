import axios from "axios";

export type HubspotPayload = {
  firstName: string;
  lastName: string;
  email: string;
  created_at: string;
  current_job_title: string | null;
  current_country: string;
  score: number | null;
  tier: string | null;
  vb_validation_page_url: string | null;
};

export const FIELD_MAPPING = {
  firstName: "firstname",
  lastName: "lastname",
  email: "email",
  created_at: "badges_created_at",
  current_job_title: "jobtitle",
  current_country: "headquarters",
  score: "badges_score",
  tier: "badges_tier",
  vb_validation_page_url: "badges_validation_page_url",
} as const;

const HUBSPOT_PAGE_NAME = "Global Badges Assessment";
const HUBSPOT_TIMEOUT_MS = 5000;

const regionDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

export const getHubspotCountryValue = (country: string) => {
  const trimmedCountry = country.trim();

  if (/^[A-Za-z]{2}$/.test(trimmedCountry)) {
    return regionDisplayNames.of(trimmedCountry.toUpperCase()) ?? trimmedCountry;
  }

  return trimmedCountry;
};

export const buildFields = (payload: HubspotPayload) => {
  return (Object.entries(FIELD_MAPPING) as Array<
    [keyof HubspotPayload, (typeof FIELD_MAPPING)[keyof typeof FIELD_MAPPING]]
  >).reduce<Array<{ name: string; value: string }>>((fields, [key, fieldName]) => {
    const value = payload[key];

    if (value === null || value === undefined) {
      return fields;
    }

    const stringValue = key === "current_country"
      ? getHubspotCountryValue(String(value))
      : String(value).trim();

    if (stringValue.length === 0) {
      return fields;
    }

    fields.push({
      name: fieldName,
      value: stringValue,
    });

    return fields;
  }, []);
};

export async function submitToHubspot(payload: HubspotPayload) {
  const { env } = await import("../config/env");
  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${env.hubspotPortalId}/${env.hubspotFormId}`;

  await axios.post(
    url,
    {
      submittedAt: Date.now(),
      fields: buildFields(payload),
      context: {
        pageName: HUBSPOT_PAGE_NAME,
      },
    },
    {
      timeout: HUBSPOT_TIMEOUT_MS,
    }
  );
}
