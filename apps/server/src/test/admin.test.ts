import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { createAuthedClient } from "./helpers.js";

async function loginAdmin(app: ReturnType<typeof createApp>) {
  const response = await request(app).post("/api/admin/login").send({
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD
  });

  return response.body.token as string;
}

describe("admin APIs", () => {
  it("logs in with configured admin credentials", async () => {
    const app = createApp();

    const response = await request(app).post("/api/admin/login").send({
      username: env.ADMIN_USERNAME,
      password: env.ADMIN_PASSWORD
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.admin.username).toBe("admin");
  });

  it("lists users and bans a user", async () => {
    const { app } = await createAuthedClient();
    const adminToken = await loginAdmin(app);

    const usersResponse = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const userId = usersResponse.body[0].id as string;
    const banResponse = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "banned" })
      .expect(200);

    expect(banResponse.body.status).toBe("banned");
  });

  it("creates, updates, lists, and deletes template plans", async () => {
    const app = createApp();
    const adminToken = await loginAdmin(app);

    const createResponse = await request(app)
      .post("/api/admin/templates")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "AI 创作者入门模板",
        goal: "完成第一轮市场扫描",
        tags: ["AI"],
        milestones: [
          {
            title: "扫描市场",
            description: "找到真实需求",
            sort_order: 1,
            tasks: [{ title: "收集 10 条需求", sort_order: 1 }]
          }
        ]
      })
      .expect(201);

    const templateId = createResponse.body._id as string;

    await request(app)
      .put(`/api/admin/templates/${templateId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "AI 创作者进阶模板", milestones: [] })
      .expect(200);

    const listResponse = await request(app)
      .get("/api/admin/templates")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(listResponse.body[0].title).toBe("AI 创作者进阶模板");

    await request(app)
      .delete(`/api/admin/templates/${templateId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });

  it("shows a user's plan details and copies a template into that user", async () => {
    const { app } = await createAuthedClient();
    const adminToken = await loginAdmin(app);

    const usersResponse = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const userId = usersResponse.body[0].id as string;

    const templateResponse = await request(app)
      .post("/api/admin/templates")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "复制测试模板",
        goal: "验证模板复制",
        tags: ["AI"],
        milestones: [
          {
            title: "第一关",
            description: "复制阶段",
            sort_order: 1,
            tasks: [
              {
                title: "复制任务",
                description: "复制任务描述",
                execution_platforms: ["Reddit"],
                search_keywords: ["coach workflow"],
                completion_criteria: "复制完成",
                weight: 10,
                priority: "high",
                tags: ["复制"],
                remark: "",
                sort_order: 1
              }
            ]
          }
        ]
      })
      .expect(201);

    const copyResponse = await request(app)
      .post(`/api/admin/templates/${templateResponse.body._id}/copy-to-user`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: userId })
      .expect(201);

    expect(copyResponse.body.title).toBe("复制测试模板");

    const plansResponse = await request(app)
      .get(`/api/admin/users/${userId}/plans`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const copiedPlan = plansResponse.body.find((plan: { title: string }) => plan.title === "复制测试模板");
    expect(copiedPlan.milestones[0].title).toBe("第一关");
    expect(copiedPlan.milestones[0].tasks[0].title).toBe("复制任务");
    expect(copiedPlan.milestones[0].tasks[0].status).toBe("todo");
  });

  it("returns basic admin stats", async () => {
    const { app } = await createAuthedClient();
    const adminToken = await loginAdmin(app);

    const response = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.plans_count).toBeGreaterThan(0);
    expect(response.body.average_completion_rate).toBeGreaterThanOrEqual(0);
    expect(response.body.retention.d1).toBeNull();
  });
});
