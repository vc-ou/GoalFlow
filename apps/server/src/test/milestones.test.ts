import request from "supertest";
import { describe, expect, it } from "vitest";
import { createAuthedClient } from "./helpers.js";

describe("milestones", () => {
  it("creates, updates, and deletes milestones for the current user's plan", async () => {
    const { app, token } = await createAuthedClient();

    const plansResponse = await request(app)
      .get("/api/plans")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const planId = plansResponse.body[0]._id as string;

    const createResponse = await request(app)
      .post("/api/milestones")
      .set("Authorization", `Bearer ${token}`)
      .send({
        plan_id: planId,
        title: "验证新阶段",
        description: "补一个新阶段",
        sort_order: 3
      })
      .expect(201);

    expect(createResponse.body.title).toBe("验证新阶段");

    const milestoneId = createResponse.body._id as string;

    await request(app)
      .put(`/api/milestones/${milestoneId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "验证新阶段已更新",
        description: "更新后的描述",
        sort_order: 2
      })
      .expect(200);

    const detailResponse = await request(app)
      .get(`/api/plans/${planId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(detailResponse.body.milestones.some((item: { title: string }) => item.title === "验证新阶段已更新")).toBe(true);

    await request(app)
      .delete(`/api/milestones/${milestoneId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const afterDelete = await request(app)
      .get(`/api/plans/${planId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(afterDelete.body.milestones.some((item: { id: string }) => item.id === milestoneId)).toBe(false);
  });
});
