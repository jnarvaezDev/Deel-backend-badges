import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.hoisted(() => vi.fn());

vi.mock("../src/db", () => ({
  default: {
    query: queryMock,
  },
}));

import { createOrUpdateLead } from "../src/services/lead.service";

describe("createOrUpdateLead", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it("normalizes missing unemployed job titles to Not applicable", async () => {
    await createOrUpdateLead({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@gmail.com",
      employmentStatus: "unemployed",
      currentJobTitle: "   ",
      currentCountry: "Argentina",
    });

    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [
      "Jane Doe",
      "jane@gmail.com",
      "unemployed",
      "Not applicable",
      "Argentina",
    ]);
  });
});
