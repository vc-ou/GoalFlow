import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/user.js";
import type { UserDocument } from "../models/user.js";

type LeanEntity<T> = T & { _id: unknown };

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Missing token" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await UserModel.findById(payload.userId).select("status").lean<LeanEntity<UserDocument> | null>();

    if (!user) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
      return;
    }

    if (user.status === "banned") {
      res.status(403).json({ code: "USER_BANNED", message: "User is banned" });
      return;
    }

    req.user = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
  }
}
