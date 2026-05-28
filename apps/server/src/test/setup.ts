import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";
import { connectDatabase } from "../config/db.js";

process.env.JWT_SECRET = "test-secret";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/goalflow-test";
process.env.DEV_USE_INMEMORY_DB = "true";
process.env.WECHAT_APP_ID = "";
process.env.WECHAT_APP_SECRET = "";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "goalflow-admin";

beforeAll(async () => {
  await connectDatabase();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.close();
});
