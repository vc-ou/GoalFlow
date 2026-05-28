import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { seedDemoData } from "./scripts/seed-data.js";

async function bootstrap() {
  await connectDatabase();
  if (env.DEV_USE_INMEMORY_DB) {
    await seedDemoData();
  }
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`GoalFlow server listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
