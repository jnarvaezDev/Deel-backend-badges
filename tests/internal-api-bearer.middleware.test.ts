import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/env", () => ({
  env: {
    internalApiBearerToken: "secret-token",
  },
}));

import { requireInternalApiBearerToken } from "../src/middlewares/internal-api-bearer";

const createResponse = () => {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return response;
};

describe("requireInternalApiBearerToken", () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without bearer token", () => {
    const req = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const res = createResponse();

    requireInternalApiBearerToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects requests with wrong bearer token", () => {
    const req = {
      get: vi.fn().mockReturnValue("Bearer wrong-token"),
    } as unknown as Request;
    const res = createResponse();

    requireInternalApiBearerToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows requests with matching bearer token", () => {
    const req = {
      get: vi.fn().mockReturnValue("Bearer secret-token"),
    } as unknown as Request;
    const res = createResponse();

    requireInternalApiBearerToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
