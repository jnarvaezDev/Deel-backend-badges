import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../src/db", () => ({
  default: {
    query: queryMock,
  },
}));

import {
  fetchLeadsTable,
  fetchResultsTable,
  parseTablePagination,
} from "../src/services/table.service";

describe("parseTablePagination", () => {
  it("uses sane defaults for invalid input", () => {
    expect(parseTablePagination("0", "-1")).toEqual({
      page: 1,
      limit: 25,
      offset: 0,
    });
  });

  it("caps the page size", () => {
    expect(parseTablePagination("2", "999")).toEqual({
      page: 2,
      limit: 100,
      offset: 100,
    });
  });
});

describe("table service", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns results rows with pagination metadata", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            name: "Jane Doe",
            email: "jane@acme.com",
            employment_status: "employed",
            current_job_title: "Manager",
            current_country: "Argentina",
            score: 95,
            tier: "Global Leader",
            assessment_data: { badge: "leader" },
            vb_recipient_id: "vb-1",
            vb_certificate_id: "cert-1",
            vb_validation_url: "https://example.com",
            vb_status: "issued",
            vb_validation_page_url: "https://example.com/verify",
            identification_number: "ABC",
            created_at: "2026-06-05T00:00:00.000Z",
          },
        ],
      });

    const response = await fetchResultsTable(parseTablePagination("1", "2"));

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("FROM results"),
      [2, 0]
    );
    expect(response.total).toBe(3);
    expect(response.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(response.data).toHaveLength(1);
  });

  it("returns leads rows with pagination metadata", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            name: "Lead User",
            email: "lead@acme.com",
            employment_status: "unemployed",
            current_job_title: "Recruiter",
            current_country: "Mexico",
            created_at: "2026-06-05T00:00:00.000Z",
          },
        ],
      });

    const response = await fetchLeadsTable(parseTablePagination("1", "25"));

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("FROM leads"),
      [25, 0]
    );
    expect(response.pagination).toEqual({
      page: 1,
      limit: 25,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(response.data[0]?.email).toBe("lead@acme.com");
  });
});
