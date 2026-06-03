import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { UserModel } from "../models/user.js";

describe("login", () => {
  it("creates a user and returns a JWT with dev fallback when WeChat config is absent", async () => {
    const app = createApp();
    const response = await request(app).post("/api/login").send({
      code: "demo"
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.nickname).toBe("微信用户");
  });

  it("blocks banned users from business APIs", async () => {
    const app = createApp();
    const loginResponse = await request(app).post("/api/login").send({
      code: "banned-user",
      nickname: "Banned Demo"
    });

    await UserModel.findByIdAndUpdate(loginResponse.body.user.id, { status: "banned" });

    const response = await request(app)
      .get("/api/home")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("USER_BANNED");
  });

  it("refreshes nickname and avatar when an existing WeChat user logs in again", async () => {
    const app = createApp();

    await request(app).post("/api/login").send({
      code: "same-user",
      nickname: "旧昵称",
      avatar: "old.png"
    });

    const response = await request(app).post("/api/login").send({
      code: "same-user",
      nickname: "新昵称",
      avatar: "new.png"
    });

    expect(response.status).toBe(200);
    expect(response.body.user.nickname).toBe("新昵称");
    expect(response.body.user.avatar).toBe("new.png");
  });

  it("handles two concurrent logins for the same WeChat user", async () => {
    const app = createApp();

    const responses = await Promise.all([
      request(app).post("/api/login").send({ code: "concurrent-user" }),
      request(app).post("/api/login").send({ code: "concurrent-user" })
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(responses[0].body.user.id).toBe(responses[1].body.user.id);
  });

  it("updates profile nickname and avatar after login", async () => {
    const app = createApp();
    const loginResponse = await request(app).post("/api/login").send({
      code: "profile-user"
    });

    const response = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        nickname: "真实昵称",
        avatar: "https://example.com/avatar.png"
      });

    expect(response.status).toBe(200);
    expect(response.body.nickname).toBe("真实昵称");
    expect(response.body.avatar).toBe("https://example.com/avatar.png");
  });
});
