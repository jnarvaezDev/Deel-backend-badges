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
    ip,
    country,
    isBrazil: country === "BR",
  };
}

function maskIp(ip: string | null): string | null {
  if (!ip) return null;

  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    return `${ipv4Match[1]}.${ipv4Match[2]}.xxx.xxx`;
  }

  const [firstSegment, secondSegment] = ip.split(":");
  return [firstSegment, secondSegment].filter(Boolean).join(":") + ":xxxx";
}

export function getGeoController(req: Request, res: Response) {
  try {
    const result = getGeoResult(req);

    console.info("[geo.controller] country detection", {
      ip: maskIp(result.ip),
      country: result.country,
      isBrazil: result.isBrazil,
    });

    return res.status(200).json({
      country: result.country,
      isBrazil: result.isBrazil,
    });
  } catch (error) {
    console.error("[geo.controller]", error);

    return res.status(200).json(DEFAULT_GEO_RESPONSE);
  }
}
