import cors from "cors";
import express from "express";
import morgan from "morgan";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { homeRouter } from "./routes/home.js";
import { milestonesRouter } from "./routes/milestones.js";
import { plansRouter } from "./routes/plans.js";
import { tasksRouter } from "./routes/tasks.js";
import { tomorrowTodosRouter } from "./routes/tomorrow-todos.js";
import { reviewsRouter } from "./routes/reviews.js";
import { profileRouter } from "./routes/profile.js";
import { adminRouter } from "./routes/admin.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/health", healthRouter);
  app.use("/api", authRouter);
  app.use("/api", adminRouter);
  app.use("/api", homeRouter);
  app.use("/api", milestonesRouter);
  app.use("/api", plansRouter);
  app.use("/api", tasksRouter);
  app.use("/api", tomorrowTodosRouter);
  app.use("/api", reviewsRouter);
  app.use("/api", profileRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
  });

  return app;
}
