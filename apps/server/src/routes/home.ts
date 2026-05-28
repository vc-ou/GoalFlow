import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getHomePayload } from "../services/home-service.js";

export const homeRouter = Router();

homeRouter.get(
  "/home",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = await getHomePayload((req as AuthenticatedRequest).user!.userId);
    res.json(payload);
  })
);
