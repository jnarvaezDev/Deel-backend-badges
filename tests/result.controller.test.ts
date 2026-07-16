import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.hoisted(() => vi.fn());
const submitToHubspotMock = vi.hoisted(() => vi.fn());

vi.mock("../src/db", () => ({
  default: {
    query: queryMock,
  },
}));

vi.mock("../src/services/hubspot.service", async (importActual) => {
  const actual = await importActual<typeof import("../src/services/hubspot.service")>();

  return {
    ...actual,
    submitToHubspot: submitToHubspotMock,
  };
});

vi.mock("../src/services/virtualbadge.service", () => ({
  getVirtualBadgeTemplateId: vi.fn(),
  issueVirtualBadge: vi.fn(),
}));

import { submitResults } from "../src/controllers/result.controller";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("submitResults", () => {
  beforeEach(() => {
    queryMock.mockReset();
    submitToHubspotMock.mockReset();
    submitToHubspotMock.mockResolvedValue(undefined);
  });

  it("sends mapped assessment intent values to HubSpot", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 123 }] });

    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn().mockReturnThis();

    await submitResults(
      {
        body: {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@acme.com",
          employmentStatus: "employed",
          currentCountry: "Argentina",
          badge: "none",
          score: 42,
          intent: {
            hiringGlobalRoles: true,
            seekingOpportunities: true,
            exploring: false,
          },
        },
      } as any,
      {
        status: statusMock,
        json: jsonMock,
      } as any
    );

    await flushPromises();

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(submitToHubspotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "hiring_global_roles;international_job_opportunities",
      })
    );
  });
});
