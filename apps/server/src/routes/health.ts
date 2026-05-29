import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ ok: true });
});

healthRouter.get("/version", (_req, res) => {
  res.json({
    ok: true,
    version: process.env.GIT_COMMIT || process.env.CLOUDBASERUN_VERSION || "local",
    loginErrors: "wechat-auth-details",
    authClassifier: "fallback-visible",
    diagnostics: "fetch-cause"
  });
});
