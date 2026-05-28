import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlanDetailPage from "../pages/plans/detail.vue";

let mockedIsCurrent = false;

vi.mock("@dcloudio/uni-app", () => ({
  onLoad: (callback: (options: Record<string, string>) => void) => callback({ id: "plan-1" })
}));

vi.mock("../api/auth", () => ({
  ensureDemoLogin: vi.fn().mockResolvedValue("token")
}));

vi.mock("../api/plans", () => ({
  fetchPlanDetail: vi.fn().mockImplementation(async () => ({
    id: "plan-1",
    title: "AI 创作者成长路径",
    goal: "持续输出",
    cover_color: "green",
    status: "active",
    is_current: mockedIsCurrent,
    milestones: [
      {
        id: "m-1",
        title: "用 AI 扫描国际市场",
        description: "阶段一",
        sort_order: 1,
        tasks: [
          {
            id: "t-1",
            title: "去平台收集需求",
            description: "",
            execution_platforms: [],
            search_keywords: [],
            completion_criteria: "",
            weight: 10,
            status: "doing",
            priority: "high",
            tags: [],
            remark: "",
            sort_order: 1
          }
        ]
      },
      {
        id: "m-2",
        title: "做出第一版样板内容",
        description: "阶段二",
        sort_order: 2,
        tasks: []
      }
    ]
  })),
  setCurrentPlan: vi.fn().mockImplementation(async () => {
    mockedIsCurrent = true;
    return {};
  }),
  updatePlan: vi.fn().mockResolvedValue({}),
  updatePlanStatus: vi.fn().mockResolvedValue({}),
  deletePlan: vi.fn().mockResolvedValue({})
}));

vi.mock("../api/milestones", () => ({
  createMilestone: vi.fn().mockResolvedValue({}),
  updateMilestone: vi.fn().mockResolvedValue({}),
  deleteMilestone: vi.fn().mockResolvedValue({})
}));

vi.mock("../api/tasks", () => ({
  createTask: vi.fn().mockResolvedValue({}),
  updateTask: vi.fn().mockResolvedValue({}),
  updateTaskStatus: vi.fn().mockResolvedValue({})
}));

const { updateTaskStatus: updateTaskStatusMock } = await import("../api/tasks");
const { createTask: createTaskMock } = await import("../api/tasks");
const { createMilestone: createMilestoneMock } = await import("../api/milestones");
const { setCurrentPlan: setCurrentPlanMock, updatePlan: updatePlanMock } = await import("../api/plans");

describe("PlanDetailPage", () => {
  beforeEach(() => {
    mockedIsCurrent = false;
    vi.clearAllMocks();
    vi.mocked(uni.getStorageSync).mockImplementation((key?: string) => (key === "token" ? "token" : ""));
  });

  it("marks the current milestone in the stage tabs", async () => {
    const wrapper = mount(PlanDetailPage);
    await Promise.resolve();

    expect(wrapper.text()).toContain("当前推进阶段");
    expect(wrapper.text()).toContain("用 AI 扫描国际市场");
    expect(wrapper.text()).toContain("写阶段复盘");
  });

  it("supports quick status updates from the task list", async () => {
    const wrapper = mount(PlanDetailPage);
    await flushPromises();

    const buttons = wrapper.findAll("button");
    const doneButton = buttons.find((button) => button.text() === "done");

    expect(doneButton).toBeTruthy();

    await doneButton!.trigger("click");

    expect(updateTaskStatusMock).toHaveBeenCalledWith("t-1", "done");
    expect(wrapper.text()).toContain("按住拖动排序");
    expect(wrapper.text()).not.toContain("上移");
    expect(wrapper.text()).not.toContain("下移");
  });

  it("disables the task button for its current status", async () => {
    const wrapper = mount(PlanDetailPage);
    await flushPromises();

    const doingButton = wrapper.findAll("button").find((button) => button.text() === "doing");
    expect(doingButton?.attributes("disabled")).toBeDefined();

    await doingButton!.trigger("click");

    expect(updateTaskStatusMock).not.toHaveBeenCalledWith("t-1", "doing");
  });

  it("supports creating a milestone from the plan detail page", async () => {
    const wrapper = mount(PlanDetailPage);
    await flushPromises();

    const milestoneSectionText = wrapper.text();
    expect(milestoneSectionText).toContain("新增行动");

    const expandButtons = wrapper.findAll("button").filter((item) => item.text() === "展开");
    await expandButtons[0]!.trigger("click");

    const milestoneTextareas = wrapper
      .findAll("textarea")
      .filter((item) => item.attributes("placeholder")?.includes("阶段描述"));

    await milestoneTextareas[milestoneTextareas.length - 1]!.setValue("验证新的阶段方向");

    const milestoneInputs = wrapper
      .findAll("input")
      .filter((item) => item.attributes("placeholder")?.includes("阶段名称"));

    await milestoneInputs[milestoneInputs.length - 1]!.setValue("做第二轮验证");

    const button = wrapper
      .findAll("button")
      .find((item) => item.text() === "先创建阶段");

    expect(button).toBeTruthy();

    await button!.trigger("click");

    expect(createMilestoneMock).toHaveBeenCalledWith({
      plan_id: "plan-1",
      title: "做第二轮验证",
      description: "验证新的阶段方向",
      sort_order: 3
    });
  });

  it("sets the plan as current after creating a task", async () => {
    const wrapper = mount(PlanDetailPage);
    await flushPromises();

    const expandButton = wrapper.findAll("button").find((item) => item.text() === "展开");
    await expandButton!.trigger("click");

    const taskNameInput = wrapper
      .findAll("input")
      .find((item) => item.attributes("placeholder") === "任务名称");
    await taskNameInput!.setValue("新增首页任务");

    const createButton = wrapper.findAll("button").find((item) => item.text() === "创建任务");
    await createButton!.trigger("click");

    expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
      plan_id: "plan-1",
      milestone_id: "m-1",
      title: "新增首页任务"
    }));
    expect(setCurrentPlanMock).toHaveBeenCalledWith("plan-1");
  });

  it("updates the current plan button after setting current", async () => {
    const wrapper = mount(PlanDetailPage);
    await flushPromises();

    const button = wrapper.findAll("button").find((item) => item.text() === "设为当前计划");
    expect(button).toBeTruthy();

    await button!.trigger("click");
    await flushPromises();

    expect(setCurrentPlanMock).toHaveBeenCalledWith("plan-1");
    expect(wrapper.text()).toContain("已是当前计划");
  });

  it("keeps the current plan button selected from local cache", async () => {
    vi.mocked(uni.getStorageSync).mockImplementation((key?: string) => {
      if (key === "token") return "token";
      if (key === "current_plan_id") return "plan-1";
      return "";
    });

    const wrapper = mount(PlanDetailPage);
    await flushPromises();

    expect(wrapper.text()).toContain("已是当前计划");
    const button = wrapper.findAll("button").find((item) => item.text() === "已是当前计划");
    expect(button?.attributes("disabled")).toBeDefined();
  });

  it("supports editing the plan itself", async () => {
    const wrapper = mount(PlanDetailPage);
    await flushPromises();

    const planNameInput = wrapper
      .findAll("input")
      .find((item) => item.attributes("placeholder") === "计划名称");
    expect(planNameInput).toBeTruthy();

    await planNameInput!.setValue("AI 创作者进阶路线");

    const button = wrapper.findAll("button").find((item) => item.text() === "保存路线");
    expect(button).toBeTruthy();

    await button!.trigger("click");

    expect(updatePlanMock).toHaveBeenCalledWith("plan-1", {
      title: "AI 创作者进阶路线",
      goal: "持续输出",
      cover_color: "green",
      tags: []
    });
  });
});
