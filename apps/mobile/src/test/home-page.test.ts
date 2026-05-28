import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "../pages/home/index.vue";

vi.mock("@dcloudio/uni-app", () => ({
  onShow: vi.fn()
}));

vi.mock("../api/auth", () => ({
  ensureDemoLogin: vi.fn().mockResolvedValue("token")
}));

vi.mock("../api/home", () => ({
  updateTaskStatusFromHome: vi.fn().mockResolvedValue({})
}));

vi.mock("../api/plans", () => ({
  setCurrentPlan: vi.fn().mockResolvedValue({})
}));

vi.mock("../api/tomorrow-todos", () => ({
  createTomorrowTodo: vi.fn().mockResolvedValue({}),
  deleteTomorrowTodo: vi.fn().mockResolvedValue({}),
  reorderTomorrowTodos: vi.fn().mockResolvedValue({ success: true }),
  updateTomorrowTodo: vi.fn().mockResolvedValue({})
}));

const store: {
  data: Record<string, any>;
  fetchHome: ReturnType<typeof vi.fn>;
} = {
  data: {
    current_plan: { title: "AI 创作者成长路径" },
    current_milestone: { title: "用 AI 扫描国际市场" },
    next_action: {
      id: "task-1",
      title: "去平台收集需求",
      description: "记录问题",
      execution_platforms: ["Reddit"],
      search_keywords: ["coaches AI workflow"],
      completion_criteria: "记录 10 个真实需求",
      status: "doing",
      priority: "high"
    },
    recommended_tasks: [
      {
        id: "task-1",
        title: "去平台收集需求",
        description: "记录问题",
        execution_platforms: ["Reddit"],
        search_keywords: ["coaches AI workflow"],
        completion_criteria: "记录 10 个真实需求",
        status: "doing",
        priority: "high"
      },
      {
        id: "task-2",
        title: "整理高频问题",
        description: "归纳重复提到的痛点",
        execution_platforms: ["Notion"],
        search_keywords: ["creator pain points"],
        completion_criteria: "整理 5 条高频问题",
        status: "todo",
        priority: "normal"
      }
    ],
    tomorrow_todos: [],
    recent_completed_tasks: [
      { id: "done-1", title: "完成账号定位", completed_at: "2026-05-26T10:00:00.000Z" }
    ]
  },
  fetchHome: vi.fn().mockImplementation(async () => undefined)
};

vi.mock("../stores/home", () => ({
  useHomeStore: () => store
}));

const { updateTaskStatusFromHome: updateTaskStatusFromHomeMock } = await import("../api/home");
const { setCurrentPlan: setCurrentPlanMock } = await import("../api/plans");
const {
  deleteTomorrowTodo: deleteTomorrowTodoMock,
  reorderTomorrowTodos: reorderTomorrowTodosMock
} = await import("../api/tomorrow-todos");

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("HomePage", () => {
  beforeEach(() => {
    store.data = {
      current_plan: { title: "AI 创作者成长路径" },
      current_milestone: { title: "用 AI 扫描国际市场" },
      next_action: {
        id: "task-1",
        title: "去平台收集需求",
        description: "记录问题",
        execution_platforms: ["Reddit"],
        search_keywords: ["coaches AI workflow"],
        completion_criteria: "记录 10 个真实需求",
        status: "doing",
        priority: "high"
      },
      recommended_tasks: [
        {
          id: "task-1",
          title: "去平台收集需求",
          description: "记录问题",
          execution_platforms: ["Reddit"],
          search_keywords: ["coaches AI workflow"],
          completion_criteria: "记录 10 个真实需求",
          status: "doing",
          priority: "high"
        },
        {
          id: "task-2",
          title: "整理高频问题",
          description: "归纳重复提到的痛点",
          execution_platforms: ["Notion"],
          search_keywords: ["creator pain points"],
          completion_criteria: "整理 5 条高频问题",
          status: "todo",
          priority: "normal"
        }
      ],
      tomorrow_todos: [],
      recent_completed_tasks: [
        { id: "done-1", title: "完成账号定位", completed_at: "2026-05-26T10:00:00.000Z" }
      ]
    };
    store.fetchHome.mockClear();
    vi.mocked(updateTaskStatusFromHomeMock).mockClear();
    vi.mocked(setCurrentPlanMock).mockClear();
    vi.mocked(deleteTomorrowTodoMock).mockClear();
    vi.mocked(reorderTomorrowTodosMock).mockClear();
    vi.mocked(uni.getStorageSync).mockImplementation((key?: string) => {
      if (key === "token") return "token";
      if (key === "user_nickname") return "微信昵称";
      return "";
    });
  });

  it("renders next action and recent completed tasks", async () => {
    const wrapper = mount(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("微信昵称");
    expect(wrapper.text()).toContain("去平台收集需求");
    expect(wrapper.text()).toContain("今日冒险");
    expect(wrapper.text()).toContain("战利品");
    expect(wrapper.text()).toContain("完成账号定位");
    expect(wrapper.text()).toContain("存档复盘");
    expect(wrapper.text()).toContain("写存档");
    expect(wrapper.text()).not.toContain("刷新首页");
  });

  it("switches tab for primary navigation destinations", async () => {
    const wrapper = mount(HomePage);
    await flushPromises();

    const planButton = wrapper.findAll("button").find((button) => button.text() === "打开路线");
    const reviewButton = wrapper.findAll("button").find((button) => button.text() === "存档复盘");

    await planButton!.trigger("click");
    await reviewButton!.trigger("click");

    expect(uni.switchTab).toHaveBeenCalledWith({ url: "/pages/plans/index" });
    expect(uni.switchTab).toHaveBeenCalledWith({ url: "/pages/reviews/index" });
  });

  it("explains when a current plan needs to be selected", async () => {
    store.data = {
      ...store.data,
      needs_plan_selection: true,
      current_plan: null,
      current_milestone: null,
      next_action: null,
      recommended_tasks: []
    } as typeof store.data;

    const wrapper = mount(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("还没有当前计划");
    expect(wrapper.text()).toContain("你已经有多条路线，但还没选择当前推进路线。");

    const selectButton = wrapper.findAll("button").find((button) => button.text() === "去设为当前计划");
    await selectButton!.trigger("click");

    expect(uni.switchTab).toHaveBeenCalledWith({ url: "/pages/plans/index" });
  });

  it("syncs a locally cached current plan before showing an empty home", async () => {
    vi.mocked(uni.getStorageSync).mockImplementation((key?: string) => {
      if (key === "token") return "token";
      if (key === "current_plan_id") return "plan-1";
      return "";
    });
    store.data = {
      ...store.data,
      needs_plan_selection: true,
      current_plan: null,
      current_milestone: null,
      next_action: null,
      recommended_tasks: []
    };

    mount(HomePage);
    await flushPromises();

    expect(setCurrentPlanMock).toHaveBeenCalledWith("plan-1");
    expect(store.fetchHome).toHaveBeenCalledTimes(2);
  });

  it("removes a completed recommendation locally and promotes the next task", async () => {
    const wrapper = mount(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("去平台收集需求");
    expect(wrapper.text()).toContain("整理高频问题");

    const deferred = createDeferred<Record<string, never>>();
    vi.mocked(updateTaskStatusFromHomeMock).mockReturnValueOnce(deferred.promise);

    const doneButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "直接完成");

    expect(doneButton).toBeTruthy();

    await doneButton!.trigger("click");
    await Promise.resolve();

    expect(updateTaskStatusFromHomeMock).toHaveBeenCalledWith("task-1", "done");
    expect(wrapper.text()).not.toContain("任务板去平台收集需求");
    expect(wrapper.text()).toContain("当前主线");
    expect(wrapper.text()).toContain("整理高频问题");
    expect(wrapper.text()).toContain("完成于 刚刚");

    deferred.resolve({});
    await flushPromises();
  });

  it("disables recommendation status buttons that match current status", async () => {
    const wrapper = mount(HomePage);
    await flushPromises();

    const doingButtons = wrapper.findAll("button").filter((button) => button.text().includes("doing"));
    expect(doingButtons.some((button) => button.attributes("disabled") !== undefined)).toBe(true);

    await doingButtons[0]!.trigger("click");

    expect(updateTaskStatusFromHomeMock).not.toHaveBeenCalledWith("task-1", "doing");
  });

  it("reorders tomorrow todos from the drag handle", async () => {
    store.data = {
      ...store.data,
      tomorrow_todos: [
        {
          id: "todo-1",
          content: "先搜 Reddit 需求",
          status: "todo",
          target_date: "2026-05-28",
          sort_order: 1
        },
        {
          id: "todo-2",
          content: "整理 10 条问题",
          status: "todo",
          target_date: "2026-05-28",
          sort_order: 2
        }
      ]
    } as typeof store.data;

    const wrapper = mount(HomePage);
    await flushPromises();

    const firstHandle = wrapper.find(".todo-drag-handle");
    expect(firstHandle.exists()).toBe(true);

    await firstHandle.trigger("touchstart", {
      touches: [{ clientY: 0 }],
      changedTouches: [{ clientY: 0 }]
    });
    await firstHandle.trigger("touchmove", {
      touches: [{ clientY: 70 }],
      changedTouches: [{ clientY: 70 }]
    });
    await firstHandle.trigger("touchend", {
      touches: [{ clientY: 70 }],
      changedTouches: [{ clientY: 70 }]
    });
    await flushPromises();

    expect(reorderTomorrowTodosMock).toHaveBeenCalledWith([
      { id: "todo-2", sort_order: 1 },
      { id: "todo-1", sort_order: 2 }
    ]);
  });

  it("deletes tomorrow todo by long press", async () => {
    store.data = {
      ...store.data,
      tomorrow_todos: [
        {
          id: "todo-1",
          content: "先搜 Reddit 需求",
          status: "todo",
          target_date: "2026-05-28",
          sort_order: 1
        }
      ]
    } as typeof store.data;

    const wrapper = mount(HomePage);
    await flushPromises();

    await wrapper.find(".todo-copy").trigger("longpress");
    await flushPromises();

    expect(deleteTomorrowTodoMock).toHaveBeenCalledWith("todo-1");
  });
});
