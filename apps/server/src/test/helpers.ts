import request from "supertest";
import { createApp } from "../app.js";
import { seedDemoData } from "../scripts/seed-data.js";

export async function createAuthedClient() {
  const app = createApp();
  await seedDemoData();

  const loginResponse = await request(app).post("/api/login").send({
    code: "demo",
    nickname: "GoalFlow Demo"
  });

  return {
    app,
    token: loginResponse.body.token as string
  };
}
