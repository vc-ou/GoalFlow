import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TaskDetailPage from "../pages/tasks/detail.vue";

vi.mock("@dcloudio/uni-app", () => ({
  onLoad: (callback: (options: Record<string, string>) => void) => callback({ id: "task-1" })
}));

vi.mock("../api/auth", () => ({
  ensureDemoLogin: vi.fn().mockResolvedValue("token")
}));

vi.mock("../api/tasks", () => ({
  fetchTask: vi.fn().mockResolvedValue({
    id: "task-1",
    plan_id: "plan-1",
    title: "训练自己从噪音中发现新号",
    description: "像产品经理练用户研究，设计师练审美一样",
    execution_platforms: ["小红书", "即刻", "Reddit", "推特"],
    search_keywords: ["AI创作者需求雷达", "副业闭环案例"],
    completion_criteria: "每天记录 10 条真实需求。",
    weight: 10,
    status: "done",
    priority: "normal",
    tags: [],
    remark: "只做一件事：训练自己从噪音中发现信号。",
    sort_order: 1
  }),
  updateTask: vi.fn().mockResolvedValue({}),
  updateTaskStatus: vi.fn().mockResolvedValue({})
}));

const { updateTask: updateTaskMock } = await import("../api/tasks");

describe("TaskDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uni.getStorageSync).mockImplementation((key?: string) => (key === "token" ? "token" : ""));
  });

  it("merges legacy execution fields into the how-to textarea and saves from one field", async () => {
    const wrapper = mount(TaskDetailPage);
    await flushPromises();

    expect(wrapper.text()).not.toContain("执行平台");
    expect(wrapper.text()).not.toContain("搜索关键词");
    expect(wrapper.text()).toContain("编辑任务");
    expect(wrapper.text()).not.toContain("保存任务");

    const textareas = wrapper.findAll("textarea");
    expect(textareas.length).toBe(3);
    expect(textareas.every((item) => item.attributes("disabled") !== undefined)).toBe(true);
    expect((textareas[0]!.element as HTMLTextAreaElement).value).toContain("可以先从这些地方开始：小红书、即刻、Reddit、推特");
    expect((textareas[0]!.element as HTMLTextAreaElement).value).toContain("也可以直接搜这些线索：AI创作者需求雷达、副业闭环案例");

    const editButton = wrapper.findAll("button").find((button) => button.text() === "编辑任务");
    await editButton!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("保存任务");
    expect(wrapper.findAll("textarea").every((item) => item.attributes("disabled") === undefined)).toBe(true);

    await textareas[0]!.setValue("先去高密度社区观察，再把信号记成卡片");
    await textareas[2]!.setValue("记录今天最有价值的一条线索");

    const saveButton = wrapper.findAll("button").find((button) => button.text() === "保存任务");
    await saveButton!.trigger("click");

    expect(updateTaskMock).toHaveBeenCalledWith("task-1", expect.objectContaining({
      description: "先去高密度社区观察，再把信号记成卡片",
      execution_platforms: [],
      search_keywords: [],
      remark: "记录今天最有价值的一条线索"
    }));
  });
});
