import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("geoip-lite", () => ({
  default: {
    lookup: vi.fn(),
  },
}));

import geoip from "geoip-lite";
import { getGeoController, getRequestIp, normalizeIp } from "../src/controllers/geo.controller";

const lookup = vi.mocked(geoip.lookup);

const createResponse = () =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }) as unknown as Response;

describe("geo controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes the first forwarded IPv4-mapped address", () => {
    expect(normalizeIp("::ffff:8.8.8.8, 10.0.0.1")).toBe("8.8.8.8");
  });

  it("prefers x-forwarded-for, then x-real-ip, then remoteAddress", () => {
    const req = {
      headers: {
        "x-forwarded-for": "::ffff:1.1.1.1, 2.2.2.2",
        "x-real-ip": "3.3.3.3",
      },
      socket: { remoteAddress: "4.4.4.4" },
    } as unknown as Request;

    expect(getRequestIp(req)).toBe("1.1.1.1");
  });

  it("returns Brazil branding metadata for Brazilian IPs", () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
    lookup.mockReturnValue({ country: "BR" } as ReturnType<typeof geoip.lookup>);

    const req = {
      headers: { "x-forwarded-for": "8.8.8.8" },
      socket: {},
    } as unknown as Request;
    const res = createResponse();

    getGeoController(req, res);

    expect(lookup).toHaveBeenCalledWith("8.8.8.8");
    expect(consoleInfo).toHaveBeenCalledWith("[geo.controller] country detection", {
      ip: "8.8.xxx.xxx",
      country: "BR",
      isBrazil: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ country: "BR", isBrazil: true });

    consoleInfo.mockRestore();
  });

  it("always returns a safe 200 response on lookup errors", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    lookup.mockImplementation(() => {
      throw new Error("lookup failed");
    });

    const req = {
      headers: { "x-real-ip": "8.8.8.8" },
      socket: {},
    } as unknown as Request;
    const res = createResponse();

    getGeoController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ country: null, isBrazil: false });

    consoleError.mockRestore();
  });
});
