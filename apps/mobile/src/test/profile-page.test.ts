import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "../pages/profile/index.vue";

vi.mock("../api/auth", () => ({
  loginWithWechat: vi.fn().mockResolvedValue("token"),
  logoutAuth: vi.fn()
}));

vi.mock("../api/profile", () => ({
  fetchProfile: vi.fn().mockResolvedValue({
    user: {
      id: "user-1",
      nickname: "微信用户",
      avatar: "",
      current_plan_id: "plan-1",
      status: "active"
    },
    stats: {
      active_plans_count: 2,
      completed_tasks_count: 7,
      reviews_count: 3
    }
  }),
  updateProfile: vi.fn().mockResolvedValue({
    id: "user-1",
    nickname: "新的昵称",
    avatar: "https://example.com/avatar.png",
    current_plan_id: "plan-1",
    status: "active"
  })
}));

const { loginWithWechat: loginWithWechatMock, logoutAuth: logoutAuthMock } = await import("../api/auth");
const { fetchProfile: fetchProfileMock, updateProfile: updateProfileMock } = await import("../api/profile");

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uni.getStorageSync).mockImplementation((key?: string) => (key === "token" ? "token" : ""));
  });

  it("renders user profile stats and account actions", async () => {
    const wrapper = mount(ProfilePage);
    await flushPromises();

    expect(wrapper.text()).toContain("冒险者档案");
    expect(wrapper.text()).toContain("微信用户");
    expect(wrapper.text()).toContain("当前目标");
    expect(wrapper.text()).toContain("完成任务");
    expect(wrapper.text()).toContain("累计存档");
    expect(wrapper.text()).toContain("7");
    expect(wrapper.text()).toContain("保存头像昵称");
    expect(wrapper.text()).toContain("清理缓存");
    expect(wrapper.text()).toContain("退出登录");
  });

  it("clears token storage when logging out", async () => {
    const wrapper = mount(ProfilePage);
    await flushPromises();

    const logoutButton = wrapper.findAll("button").find((button) => button.text() === "退出登录");
    await logoutButton!.trigger("click");

    expect(logoutAuthMock).toHaveBeenCalled();
    expect(uni.showToast).toHaveBeenCalledWith({ title: "已退出登录", icon: "none" });
    expect(wrapper.text()).toContain("微信授权登录");
  });

  it("shows login state when token is missing and loads profile after login", async () => {
    vi.mocked(uni.getStorageSync).mockReturnValue("");

    const wrapper = mount(ProfilePage);
    await flushPromises();

    expect(wrapper.text()).toContain("微信授权登录");
    expect(fetchProfileMock).not.toHaveBeenCalled();

    const loginButton = wrapper.findAll("button").find((button) => button.text() === "微信授权登录");
    vi.mocked(uni.getStorageSync).mockImplementation((key?: string) => (key === "token" ? "token" : ""));
    await loginButton!.trigger("click");
    await flushPromises();

    expect(loginWithWechatMock).toHaveBeenCalled();
    expect(fetchProfileMock).toHaveBeenCalled();
    expect(wrapper.text()).toContain("微信用户");
  });

  it("saves edited nickname and selected avatar", async () => {
    const wrapper = mount(ProfilePage);
    await flushPromises();

    await wrapper.find(".nickname-input").setValue("新的昵称");
    await wrapper.find(".avatar-picker").trigger("chooseavatar", {
      detail: { avatarUrl: "https://example.com/avatar.png" }
    });
    await wrapper.findAll("button").find((button) => button.text() === "保存头像昵称")!.trigger("click");
    await flushPromises();

    expect(updateProfileMock).toHaveBeenCalledWith({
      nickname: "新的昵称",
      avatar: "https://example.com/avatar.png"
    });
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_nickname", "新的昵称");
    expect(uni.setStorageSync).toHaveBeenCalledWith("user_avatar", "https://example.com/avatar.png");
    expect(wrapper.text()).toContain("新的昵称");
  });
});
