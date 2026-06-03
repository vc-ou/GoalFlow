import { beforeEach, describe, expect, it, vi } from "vitest";

const httpMock = vi.fn();

vi.mock("../api/http", () => ({
  http: httpMock
}));

const { loginWithWechat } = await import("../api/auth");

describe("auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uni.login).mockImplementation((options) => {
      options?.success?.({ code: "wechat-code" } as UniApp.LoginRes);
    });
    httpMock.mockResolvedValue({
      token: "jwt-token",
      user: { id: "user-1" }
    });
  });

  it("logs in with a WeChat code without requesting profile data", async () => {
    await loginWithWechat();

    expect(uni.getUserProfile).not.toHaveBeenCalled();
    expect(uni.login).toHaveBeenCalledWith(expect.objectContaining({
      provider: "weixin"
    }));
    expect(httpMock).toHaveBeenCalledWith("/login", {
      method: "POST",
      data: {
        code: "wechat-code"
      }
    });
    expect(uni.setStorageSync).toHaveBeenCalledWith("token", "jwt-token");
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_id", "user-1");
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_nickname", "微信用户");
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_avatar", "");
  });
});
