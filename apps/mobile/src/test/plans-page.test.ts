import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlansPage from "../pages/plans/index.vue";

vi.mock("../api/auth", () => ({
  ensureDemoLogin: vi.fn().mockResolvedValue("token")
}));

vi.mock("../api/plans", () => ({
  createPlan: vi.fn().mockResolvedValue({}),
  fetchPlans: vi.fn().mockResolvedValue([
    {
      id: "plan-1",
      title: "AI 创作者成长路径",
      goal: "持续输出",
      cover_color: "green",
      progress: 0.3,
      status: "active"
    }
  ])
}));

describe("PlansPage", () => {
  beforeEach(() => {
    vi.mocked(uni.switchTab).mockClear();
  });

  it("renders the hero copy and supports returning to the home tab", async () => {
    const wrapper = mount(PlansPage);
    await flushPromises();

    expect(wrapper.text()).toContain("关卡地图");
    expect(wrapper.text()).toContain("行动路线");
    expect(wrapper.text()).toContain("已解锁路线");
    expect(wrapper.text()).toContain("回冒险面板");

    const button = wrapper.findAll("button").find((item) => item.text() === "回冒险面板");
    expect(button).toBeTruthy();

    await button!.trigger("click");

    expect(uni.switchTab).toHaveBeenCalledWith({ url: "/pages/home/index" });
  });
});
