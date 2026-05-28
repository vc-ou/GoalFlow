import request from "supertest";
import { describe, expect, it } from "vitest";
import { createAuthedClient } from "./helpers.js";

describe("task progression", () => {
  it("moves a done task into recent completed tasks and advances next action", async () => {
    const { app, token } = await createAuthedClient();

    const initialHome = await request(app)
      .get("/api/home")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const currentTaskId = initialHome.body.next_action.id as string;

    await request(app)
      .post(`/api/tasks/${currentTaskId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "done" })
      .expect(200);

    const nextHome = await request(app)
      .get("/api/home")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(nextHome.body.next_action.title).toBe("整理需求清单");
    expect(nextHome.body.recent_completed_tasks[0].id).toBe(currentTaskId);
  });
});
