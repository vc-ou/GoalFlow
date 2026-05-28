import { beforeEach, describe, expect, it, vi } from "vitest";

const httpMock = vi.fn();

vi.mock("../api/http", () => ({
  http: httpMock
}));

const { loginWithWechat } = await import("../api/auth");

describe("auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uni.getUserProfile).mockImplementation((options) => {
      options?.success?.({
        userInfo: {
          nickName: "微信昵称",
          avatarUrl: "https://example.com/avatar.png"
        }
      } as UniApp.GetUserProfileRes);
    });
    vi.mocked(uni.login).mockImplementation((options) => {
      options?.success?.({ code: "wechat-code" } as UniApp.LoginRes);
    });
    httpMock.mockResolvedValue({
      token: "jwt-token",
      user: { id: "user-1" }
    });
  });

  it("gets WeChat profile before code login and sends nickname/avatar to backend", async () => {
    await loginWithWechat();

    expect(uni.getUserProfile).toHaveBeenCalledWith(expect.objectContaining({
      desc: expect.stringContaining("头像和昵称")
    }));
    expect(uni.login).toHaveBeenCalledWith(expect.objectContaining({
      provider: "weixin"
    }));
    expect(httpMock).toHaveBeenCalledWith("/login", {
      method: "POST",
      data: {
        code: "wechat-code",
        nickname: "微信昵称",
        avatar: "https://example.com/avatar.png"
      }
    });
    expect(uni.setStorageSync).toHaveBeenCalledWith("token", "jwt-token");
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_id", "user-1");
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_nickname", "微信昵称");
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_avatar", "https://example.com/avatar.png");
  });
});
