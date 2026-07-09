import type { Request, Response } from "express";
import geoip from "geoip-lite";

const DEFAULT_GEO_RESPONSE = { country: null, isBrazil: false } as const;

export function normalizeIp(ip?: string | string[] | null): string | null {
  const rawIp = Array.isArray(ip) ? ip[0] : ip;
  const candidate = rawIp?.split(",")[0]?.trim();

  if (!candidate) return null;

  return candidate.startsWith("::ffff:") ? candidate.slice(7) : candidate;
}

export function getRequestIp(req: Request): string | null {
  return (
    normalizeIp(req.headers["x-forwarded-for"]) ??
    normalizeIp(req.headers["x-real-ip"]) ??
    normalizeIp(req.socket.remoteAddress)
  );
}

function getGeoResult(req: Request) {
  const ip = getRequestIp(req);
  const geo = ip ? geoip.lookup(ip) : null;
  const country = geo?.country ?? null;

  return {
    country,
    isBrazil: country === "BR",
  };
}

export function getGeoController(req: Request, res: Response) {
  try {
    return res.status(200).json(getGeoResult(req));
  } catch (error) {
    console.error("[geo.controller]", error);

    return res.status(200).json(DEFAULT_GEO_RESPONSE);
  }
}

export function getGeoDebugController(req: Request, res: Response) {
  try {
    return res.status(200).json({
      endpoint: "debug",
      geo: getGeoResult(req),
      note: "Temporary debug endpoint. Remove after production geo validation.",
    });
  } catch (error) {
    console.error("[geo.debug]", error);

    return res.status(200).json({
      endpoint: "debug",
      geo: DEFAULT_GEO_RESPONSE,
      note: "Temporary debug endpoint. Remove after production geo validation.",
    });
  }
}
