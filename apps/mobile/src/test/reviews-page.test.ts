import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReviewsPage from "../pages/reviews/index.vue";

vi.mock("../api/auth", () => ({
  ensureDemoLogin: vi.fn().mockResolvedValue("token")
}));

vi.mock("../api/plans", () => ({
  fetchPlans: vi.fn().mockResolvedValue([
    {
      id: "plan-1",
      title: "AI 创作者成长路径",
      goal: "持续输出",
      cover_color: "green",
      progress: 0.2,
      status: "active"
    }
  ])
}));

vi.mock("../api/reviews", () => ({
  fetchReviews: vi.fn().mockResolvedValue([
    {
      id: "review-1",
      plan_id: "plan-1",
      gains: "明确了市场切口",
      problems: "",
      ideas: "",
      next_actions: "继续整理需求",
      created_at: "2026-05-27T02:00:00.000Z"
    }
  ]),
  createReview: vi.fn().mockResolvedValue({}),
  updateReview: vi.fn().mockResolvedValue({}),
  deleteReview: vi.fn().mockResolvedValue({})
}));

const { createReview: createReviewMock } = await import("../api/reviews");
const { updateReview: updateReviewMock } = await import("../api/reviews");

describe("ReviewsPage", () => {
  beforeEach(() => {
    vi.mocked(createReviewMock).mockClear();
    vi.mocked(updateReviewMock).mockClear();
  });

  it("renders saved reviews", async () => {
    const wrapper = mount(ReviewsPage);
    await flushPromises();

    expect(wrapper.text()).toContain("营地存档");
    expect(wrapper.text()).toContain("保存今天的战斗记录");
    expect(wrapper.text()).toContain("最近存档");
    expect(wrapper.text()).toContain("明确了市场切口");
    expect(wrapper.text()).toContain("继续整理需求");
    expect(wrapper.text()).toContain("回关卡地图");
    expect(wrapper.text()).toContain("保存存档");
  });

  it("returns to plans through the bottom-level primary flow entry", async () => {
    const wrapper = mount(ReviewsPage);
    await flushPromises();

    const button = wrapper.findAll("button").find((item) => item.text() === "回关卡地图");
    expect(button).toBeTruthy();

    await button!.trigger("click");

    expect(uni.switchTab).toHaveBeenCalledWith({ url: "/pages/plans/index" });
  });

  it("creates a review from the page form", async () => {
    const wrapper = mount(ReviewsPage);
    await flushPromises();

    const textareas = wrapper.findAll("textarea");
    await textareas[0]!.setValue("今天确认了第一阶段方向");
    await textareas[3]!.setValue("明天继续做样本归类");

    const button = wrapper.findAll("button").find((item) => item.text() === "保存存档");
    expect(button).toBeTruthy();

    await button!.trigger("click");

    expect(createReviewMock).toHaveBeenCalledWith({
      plan_id: null,
      gains: "今天确认了第一阶段方向",
      problems: "",
      ideas: "",
      next_actions: "明天继续做样本归类"
    });
  });

  it("edits an existing review from the list", async () => {
    const wrapper = mount(ReviewsPage);
    await flushPromises();

    const editButton = wrapper.findAll("button").find((item) => item.text() === "编辑");
    expect(editButton).toBeTruthy();

    await editButton!.trigger("click");

    expect(wrapper.text()).toContain("编辑存档");

    const textareas = wrapper.findAll("textarea");
    await textareas[0]!.setValue("更新后的收获");

    const saveButton = wrapper.findAll("button").find((item) => item.text() === "更新存档");
    expect(saveButton).toBeTruthy();

    await saveButton!.trigger("click");

    expect(updateReviewMock).toHaveBeenCalledWith("review-1", {
      plan_id: "plan-1",
      gains: "更新后的收获",
      problems: "",
      ideas: "",
      next_actions: "继续整理需求"
    });
  });
});
