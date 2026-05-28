import { connectDatabase } from "../config/db.js";
import { seedDemoData } from "./seed-data.js";

async function seed() {
  await connectDatabase();
  const user = await seedDemoData();

  console.log(`Seeded demo user: dev-demo -> ${String(user._id)}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
