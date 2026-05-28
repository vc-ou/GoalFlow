import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const envCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  DEV_USE_INMEMORY_DB: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  WECHAT_APP_ID: emptyStringAsUndefined(z.string().min(1).optional()),
  WECHAT_APP_SECRET: emptyStringAsUndefined(z.string().min(1).optional()),
  ADMIN_USERNAME: z.string().min(1).default("admin"),
  ADMIN_PASSWORD: z.string().min(1).default("goalflow-admin")
});

export const env = envSchema.parse(process.env);

function emptyStringAsUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), schema);
}
