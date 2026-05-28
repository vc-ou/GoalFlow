import request from "supertest";
import { describe, expect, it } from "vitest";
import { createAuthedClient } from "./helpers.js";
import { TaskModel } from "../models/task.js";
import { TomorrowTodoModel } from "../models/tomorrow-todo.js";
import { getLocalDateKey } from "../utils/local-date.js";
import type { TomorrowTodoDocument } from "../models/tomorrow-todo.js";

type LeanEntity<T> = T & { _id: unknown };

describe("home aggregation", () => {
  it("returns seeded next action and current milestone", async () => {
    const { app, token } = await createAuthedClient();

    const response = await request(app)
      .get("/api/home")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.current_plan.title).toBe("AI 创作者成长路径");
    expect(response.body.current_milestone.title).toBe("用 AI 扫描国际市场");
    expect(response.body.next_action.title).toBe("去平台收集需求");
    expect(response.body.recommended_tasks).toHaveLength(3);
    expect(response.body.recommended_tasks[0].description).toBeTruthy();
    expect(Array.isArray(response.body.recommended_tasks[0].execution_platforms)).toBe(true);
    expect(Array.isArray(response.body.recommended_tasks[0].search_keywords)).toBe(true);
    expect(response.body.recommended_tasks[0].completion_criteria).toBeTruthy();
  });

  it("reads tomorrow todos using the same local date key as the todo API", async () => {
    const { app, token } = await createAuthedClient();

    const today = getLocalDateKey();
    const seededTodo = await TomorrowTodoModel.findOne().lean<LeanEntity<TomorrowTodoDocument> | null>();
    await TomorrowTodoModel.create({
      user_id: seededTodo?.user_id ?? "",
      content: "今天展示的补给",
      status: "todo",
      target_date: today,
      sort_order: 99
    });

    const response = await request(app)
      .get("/api/home")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.tomorrow_todos.some((item: { content: string }) => item.content === "今天展示的补给")).toBe(true);
  });

  it("prefers the doing task that entered doing earliest", async () => {
    const { app, token } = await createAuthedClient();
    const tasks = await TaskModel.find({ status: { $in: ["doing", "todo"] }, deleted_at: null }).sort({ sort_order: 1 });
    const firstDoing = tasks.find((task) => task.status === "doing");
    const todoTask = tasks.find((task) => task.status === "todo" && task.milestone_id === firstDoing?.milestone_id);

    expect(firstDoing).toBeTruthy();
    expect(todoTask).toBeTruthy();

    firstDoing!.status_changed_at = new Date("2026-05-28T03:00:00.000Z");
    await firstDoing!.save();

    todoTask!.status = "doing";
    todoTask!.status_changed_at = new Date("2026-05-28T01:00:00.000Z");
    await todoTask!.save();

    const response = await request(app)
      .get("/api/home")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.next_action.id).toBe(String(todoTask!._id));
  });
});
