import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AdminAuthenticatedRequest extends Request {
  admin?: {
    username: string;
  };
}

export function requireAdminAuth(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ code: "ADMIN_UNAUTHORIZED", message: "Missing admin token" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { role?: string; username?: string };
    if (payload.role !== "admin" || !payload.username) {
      res.status(401).json({ code: "ADMIN_UNAUTHORIZED", message: "Invalid admin token" });
      return;
    }

    req.admin = { username: payload.username };
    next();
  } catch {
    res.status(401).json({ code: "ADMIN_UNAUTHORIZED", message: "Invalid admin token" });
  }
}
