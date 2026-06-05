import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export function requireInternalApiBearerToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const providedToken = authorizationHeader.slice("Bearer ".length).trim();

  if (!providedToken || providedToken !== env.internalApiBearerToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
}
