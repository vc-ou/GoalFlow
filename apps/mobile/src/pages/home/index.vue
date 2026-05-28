<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";
import { ensureDemoLogin } from "../../api/auth";
import { updateTaskStatusFromHome } from "../../api/home";
import { setCurrentPlan } from "../../api/plans";
import {
  createTomorrowTodo,
  deleteTomorrowTodo,
  reorderTomorrowTodos,
  updateTomorrowTodo,
  type TomorrowTodoItem
} from "../../api/tomorrow-todos";
import { useHomeStore } from "../../stores/home";
import { getTaskStatusPulse, getTaskStatusToast, type TaskStatusFeedback } from "../../utils/task-feedback";

const homeStore = useHomeStore();

type HomeSnapshot = Record<string, any>;

const optimisticHome = ref<HomeSnapshot | null>(null);
const home = computed(() => optimisticHome.value ?? (homeStore.data as HomeSnapshot | null));
const needsPlanSelection = computed(() => Boolean(home.value?.needs_plan_selection));
const planProgressPercent = computed(() => Math.round(Number(home.value?.current_plan?.progress ?? 0) * 100));
const milestoneProgressPercent = computed(() => Math.round(Number(home.value?.current_milestone?.progress ?? 0) * 100));
const greetingText = ref(getTimeGreeting());
const userNickname = ref(getCachedNickname());
const tomorrowInput = ref("");
const statusPulseTaskId = ref("");
const statusPulseType = ref<"todo" | "doing" | "done" | "">("");
const actionPendingTaskId = ref("");
const todoDragState = ref({
  id: "",
  startY: 0,
  offsetY: 0
});

async function refreshHome() {
  await ensureDemoLogin();
  syncGreetingProfile();
  await homeStore.fetchHome();
  if (homeStore.data && !(homeStore.data as HomeSnapshot).current_plan) {
    const currentPlanId = uni.getStorageSync("current_plan_id");
    if (currentPlanId && !(homeStore.data as HomeSnapshot).current_plan?.id) {
      await setCurrentPlan(String(currentPlanId));
      await homeStore.fetchHome();
    }
  }
  optimisticHome.value = null;
}

function syncGreetingProfile() {
  greetingText.value = getTimeGreeting();
  userNickname.value = getCachedNickname();
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
}

function getCachedNickname() {
  const nickname = String(uni.getStorageSync("user_nickname") || "").trim();
  return nickname || "创作者";
}

function goPlans() {
  uni.switchTab({
    url: "/pages/plans/index"
  });
}

function goReviews() {
  uni.switchTab({
    url: "/pages/reviews/index"
  });
}

function goTask(taskId: string) {
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${taskId}`
  });
}

async function setTaskStatus(taskId: string, status: TaskStatusFeedback) {
  const currentTask = findHomeTask(taskId);
  if (currentTask?.status === status) return;

  statusPulseTaskId.value = taskId;
  statusPulseType.value = getTaskStatusPulse(status);
  actionPendingTaskId.value = taskId;
  applyOptimisticHomeStatus(taskId, status);

  try {
    await updateTaskStatusFromHome(taskId, status);
    uni.showToast({
      title: getTaskStatusToast(status),
      icon: "none"
    });
    await refreshHome();
  } catch {
    optimisticHome.value = null;
    uni.showToast({
      title: "状态更新失败，请重试",
      icon: "none"
    });
  } finally {
    actionPendingTaskId.value = "";
    setTimeout(() => {
      statusPulseTaskId.value = "";
      statusPulseType.value = "";
    }, 450);
  }
}

function findHomeTask(taskId: string) {
  if (home.value?.next_action?.id === taskId) {
    return home.value.next_action;
  }

  return (home.value?.recommended_tasks || []).find((task: Record<string, any>) => task.id === taskId);
}

async function addTomorrowTodo() {
  if (!tomorrowInput.value.trim()) {
    uni.showToast({
      title: "先写下明天想做的事",
      icon: "none"
    });
    return;
  }

  await createTomorrowTodo(tomorrowInput.value.trim());
  tomorrowInput.value = "";
  await refreshHome();
}

async function toggleTomorrowTodo(item: TomorrowTodoItem) {
  await updateTomorrowTodo(String(item.id || item._id), {
    status: item.status === "done" ? "todo" : "done"
  });
  await refreshHome();
}

async function removeTomorrowTodo(item: TomorrowTodoItem) {
  await deleteTomorrowTodo(String(item.id || item._id));
  await refreshHome();
  uni.showToast({ title: "补给已删除", icon: "none" });
}

function startTodoDrag(item: TomorrowTodoItem, event: TouchEvent) {
  todoDragState.value = {
    id: getTomorrowTodoId(item),
    startY: getTouchY(event),
    offsetY: 0
  };
}

function updateTodoDrag(event: TouchEvent) {
  if (!todoDragState.value.id) return;

  todoDragState.value.offsetY = getTouchY(event) - todoDragState.value.startY;
}

async function finishTodoDrag(item: TomorrowTodoItem) {
  const drag = todoDragState.value;
  clearTodoDrag();
  if (drag.id !== getTomorrowTodoId(item)) return;

  const todos = [...(home.value?.tomorrow_todos || [])] as TomorrowTodoItem[];
  const currentIndex = todos.findIndex((todo) => getTomorrowTodoId(todo) === drag.id);
  if (currentIndex === -1) return;

  const targetIndex = currentIndex + getDragStep(drag.offsetY);
  await reorderTomorrowTodo(item, targetIndex);
}

async function reorderTomorrowTodo(item: TomorrowTodoItem, targetIndex: number) {
  if (!home.value?.tomorrow_todos?.length) return;

  const previousHome = JSON.parse(JSON.stringify(home.value)) as HomeSnapshot;
  const todos = [...home.value.tomorrow_todos] as TomorrowTodoItem[];
  const currentIndex = todos.findIndex((todo) => getTomorrowTodoId(todo) === getTomorrowTodoId(item));
  if (currentIndex === -1) return;

  const nextIndex = Math.max(0, Math.min(targetIndex, todos.length - 1));
  if (nextIndex === currentIndex) return;

  const [moved] = todos.splice(currentIndex, 1);
  todos.splice(nextIndex, 0, moved);

  const nextTodos = todos.map((todo, index) => ({
    ...todo,
    sort_order: index + 1
  }));

  optimisticHome.value = {
    ...previousHome,
    tomorrow_todos: nextTodos
  };

  try {
    await reorderTomorrowTodos(
      nextTodos.map((todo) => ({
        id: getTomorrowTodoId(todo),
        sort_order: Number(todo.sort_order)
      }))
    );
    uni.showToast({ title: "补给顺序已更新", icon: "none" });
    await refreshHome();
  } catch {
    optimisticHome.value = previousHome;
    uni.showToast({ title: "排序失败，请重试", icon: "none" });
  }
}

function getTomorrowTodoId(item: TomorrowTodoItem) {
  return String(item.id || item._id || "");
}

function getDragStep(offsetY: number) {
  const step = Math.trunc(Math.abs(offsetY) / 52);
  if (step === 0) return 0;
  return offsetY > 0 ? step : -step;
}

function getTouchY(event: TouchEvent) {
  return event.changedTouches?.[0]?.clientY ?? event.touches?.[0]?.clientY ?? 0;
}

function getTodoDragStyle(item: TomorrowTodoItem) {
  if (todoDragState.value.id !== getTomorrowTodoId(item)) return "";
  const offset = Math.max(-120, Math.min(120, todoDragState.value.offsetY));
  return `transform: translateY(${offset}px);`;
}

function clearTodoDrag() {
  todoDragState.value = {
    id: "",
    startY: 0,
    offsetY: 0
  };
}

function formatCompletedAt(value: string | null) {
  if (!value) return "刚刚";
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function applyOptimisticHomeStatus(taskId: string, status: TaskStatusFeedback) {
  if (!home.value) return;

  const snapshot = JSON.parse(JSON.stringify(home.value)) as HomeSnapshot;
  const recommendedTasks = Array.isArray(snapshot.recommended_tasks) ? snapshot.recommended_tasks : [];
  const taskIndex = recommendedTasks.findIndex((task) => task.id === taskId);

  if (snapshot.next_action?.id === taskId) {
    snapshot.next_action.status = status;
  }

  if (taskIndex >= 0) {
    recommendedTasks[taskIndex].status = status;
  }

  if (status === "done") {
    if (taskIndex >= 0) {
      const [completedTask] = recommendedTasks.splice(taskIndex, 1);
      snapshot.recommended_tasks = recommendedTasks;
      snapshot.recent_completed_tasks = [
        {
          ...completedTask,
          status: "done",
          completed_at: null
        },
        ...(snapshot.recent_completed_tasks || []).filter((task: Record<string, any>) => task.id !== taskId)
      ].slice(0, 5);
    }

    if (snapshot.next_action?.id === taskId) {
      snapshot.next_action = recommendedTasks[0] ?? null;
    }
  }

  optimisticHome.value = snapshot;
}

onMounted(() => {
  syncGreetingProfile();
  refreshHome().catch(() => {
    uni.showToast({
      title: "请先启动服务端并准备数据",
      icon: "none"
    });
  });
});

onShow(() => {
  syncGreetingProfile();
  refreshHome().catch(() => undefined);
});
</script>

<template>
  <view class="page">
    <view class="top-bar">
      <view>
        <text class="greeting">{{ greetingText }}，{{ userNickname }}</text>
        <text class="today-label">今日冒险 · 今天也在靠近目标的一天</text>
      </view>
      <view class="bell-dot">⌁</view>
    </view>

    <view class="goal-card">
      <view class="goal-content">
        <text class="eyebrow green">◎ 当前目标</text>
        <text class="goal-title">{{ home?.current_plan?.title ?? "还没有当前计划" }}</text>
        <text class="goal-copy">
          {{ home?.current_milestone?.title ?? "先解锁一条行动路线，创建挑战关卡。" }}
        </text>
        <view class="progress-row">
          <view>
            <text class="progress-label">总进度</text>
            <text class="progress-number">{{ planProgressPercent }}%</text>
          </view>
          <text class="progress-score">{{ planProgressPercent }} / 100</text>
        </view>
        <view
          class="xp-track"
          :class="{ 'xp-track-glow': statusPulseType === 'done' }"
          :style="{ '--plan-progress': `${planProgressPercent}%` }"
        >
          <view class="xp-track-fill" />
        </view>
        <text class="goal-tip">✨ 每一次行动，都是在创造未来的自己！</text>
      </view>
      <view class="mountain-art">
        <view class="flag-pole" />
        <view class="flag" />
        <view class="sun-glow" />
        <view class="hill hill-back" />
        <view class="hill hill-front" />
        <view class="road" />
      </view>
    </view>

    <view class="stage-card" v-if="home?.current_milestone">
      <view class="stage-copy">
        <text class="eyebrow green">⚑ 当前阶段</text>
        <text class="stage-title">{{ home.current_milestone.title }}</text>
        <text class="stage-subtitle">{{ home.current_milestone.description ?? "完成阶段内任务后，进度会自动推进。" }}</text>
      </view>
      <view class="ring-progress">
        <text>{{ milestoneProgressPercent }}%</text>
      </view>
    </view>

    <view class="hero-actions">
        <button class="action-button" @click="goPlans">打开路线</button>
        <button class="secondary-button" @click="goReviews">存档复盘</button>
    </view>

    <view class="content-grid">
      <view
        class="card next-card"
        v-if="home?.next_action"
        :class="{
          'card-pulse-doing': statusPulseTaskId === home.next_action.id && statusPulseType === 'doing',
          'card-pulse-done': statusPulseTaskId === home.next_action.id && statusPulseType === 'done',
          'card-pulse-todo': statusPulseTaskId === home.next_action.id && statusPulseType === 'todo'
        }"
      >
        <view class="card-head">
          <view>
            <text class="card-label purple">↯ 当前主线 · 下一步行动</text>
            <text class="card-title" @click="goTask(home.next_action.id)">{{ home.next_action.title }}</text>
            <text class="card-copy">{{ home.next_action.description }}</text>
          </view>
          <text class="chevron" @click="goTask(home.next_action.id)">›</text>
        </view>

        <view class="info-grid">
          <view class="info-tile">
            <text class="tile-icon">◎</text>
            <text class="chip-title">执行平台</text>
            <text class="tile-copy">{{ home.next_action.execution_platforms?.join(" / ") || "未填写" }}</text>
          </view>
          <view class="info-tile">
            <text class="tile-icon purple-text">⌕</text>
            <text class="chip-title">搜索关键词</text>
            <text class="tile-copy">{{ home.next_action.search_keywords?.join("、") || "未填写" }}</text>
          </view>
        </view>

        <view class="criteria-box">
          <text class="tile-icon purple-text">◎</text>
          <view>
            <text class="chip-title">完成标准</text>
            <text class="criteria">{{ home.next_action.completion_criteria }}</text>
          </view>
        </view>

        <view class="quick-actions">
          <button
            class="mini-button action-mini"
            :class="{ 'status-selected': home.next_action.status === 'doing' }"
            :disabled="actionPendingTaskId === home.next_action.id || home.next_action.status === 'doing'"
            @click="setTaskStatus(home.next_action.id, 'doing')"
          >
            设为 doing
          </button>
          <button
            class="mini-button done-mini"
            :class="{ 'status-selected': home.next_action.status === 'done' }"
            :disabled="actionPendingTaskId === home.next_action.id || home.next_action.status === 'done'"
            @click="setTaskStatus(home.next_action.id, 'done')"
          >
            直接完成
          </button>
        </view>
      </view>

      <view class="card tasks-card">
        <view class="card-head">
          <text class="card-label green">☷ 推荐任务</text>
          <text class="muted-link">查看更多 ›</text>
        </view>
        <transition-group v-if="home?.recommended_tasks?.length" name="task-stack" tag="view" class="task-stack">
          <view
            v-for="task in home.recommended_tasks"
            :key="task.id"
            class="task-row"
            :class="{
              'task-row-pulse-doing': statusPulseTaskId === task.id && statusPulseType === 'doing',
              'task-row-pulse-done': statusPulseTaskId === task.id && statusPulseType === 'done',
              'task-row-pulse-todo': statusPulseTaskId === task.id && statusPulseType === 'todo'
            }"
          >
            <view class="task-status-dot" :class="'task-status-' + task.status" />
            <view class="task-main" @click="goTask(task.id)">
              <text class="task-title">{{ task.title }}</text>
              <text class="task-meta">{{ task.status }} · {{ task.priority }}</text>
            </view>
            <view class="task-inline-actions">
              <button class="tiny-button tiny-todo" :class="{ 'status-selected': task.status === 'todo' }" :disabled="actionPendingTaskId === task.id || task.status === 'todo'" @click="setTaskStatus(task.id, 'todo')">todo</button>
              <button class="tiny-button" :class="{ 'status-selected': task.status === 'doing' }" :disabled="actionPendingTaskId === task.id || task.status === 'doing'" @click="setTaskStatus(task.id, 'doing')">doing</button>
              <button class="tiny-button tiny-done" :class="{ 'status-selected': task.status === 'done' }" :disabled="actionPendingTaskId === task.id || task.status === 'done'" @click="setTaskStatus(task.id, 'done')">done</button>
            </view>
          </view>
        </transition-group>
        <view v-else-if="needsPlanSelection" class="empty-state">
          <text class="empty">你已经有多条路线，但还没选择当前推进路线。</text>
          <button class="text-button empty-action" @click="goPlans">去设为当前计划</button>
        </view>
        <text v-else class="empty">任务板还是空的。先去路线页放入一个可挑战的小任务。</text>
      </view>

      <view class="card supply-card">
        <view class="card-head">
          <text class="card-label orange">☼ 明日补给</text>
          <button class="text-button" @click="addTomorrowTodo">＋ 添加</button>
        </view>
        <view class="todo-input-row">
          <input v-model="tomorrowInput" class="todo-input" placeholder="明天准备挑战什么？" />
        </view>
        <transition-group v-if="home?.tomorrow_todos?.length" name="todo-stack" tag="view" class="todo-stack">
          <view
            v-for="item in home.tomorrow_todos"
            :key="getTomorrowTodoId(item)"
            class="todo-row"
            :class="{ 'todo-row-dragging': todoDragState.id === getTomorrowTodoId(item) }"
            :style="getTodoDragStyle(item)"
          >
            <view
              class="todo-drag-handle"
              @touchstart="startTodoDrag(item, $event)"
              @touchmove.stop.prevent="updateTodoDrag"
              @touchend="finishTodoDrag(item)"
            >
              <text class="todo-drag-mark">::</text>
            </view>
            <view class="todo-copy" @click="toggleTomorrowTodo(item)" @longpress="removeTomorrowTodo(item)">
              <text class="task-title">{{ item.content }}</text>
              <text class="task-meta">{{ item.status === 'done' ? '已完成' : '待处理' }} · 长按删除</text>
            </view>
          </view>
        </transition-group>
        <text v-else class="empty">这里是轻量补给区。写下明天特别想挑战的一件事，不影响主线进度。</text>
      </view>

      <view class="card results-card">
        <view class="card-head">
          <view>
            <text class="card-label green">🏆 战利品 · 最近成果</text>
            <text class="card-copy muted">每一次完成，都是进步的证明</text>
          </view>
          <button class="text-button" @click="goReviews">写存档</button>
        </view>
        <view v-if="home?.recent_completed_tasks?.length" class="result-timeline">
          <view v-for="task in home.recent_completed_tasks" :key="task.id" class="result-row">
            <view class="result-check">✓</view>
            <view class="result-main">
              <text class="task-title">{{ task.title }}</text>
              <text class="task-meta">完成于 {{ formatCompletedAt(task.completed_at) }}</text>
            </view>
            <text class="result-badge">+10分</text>
          </view>
        </view>
        <text v-else class="empty">还没有战利品。完成一条任务后，顺手写一句存档，明天更容易接着打。</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40rpx 28rpx 132rpx;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 26rpx;
}

.greeting {
  display: block;
  color: #111827;
  font-size: 42rpx;
  font-weight: 900;
  letter-spacing: -0.8rpx;
}

.today-label {
  display: block;
  margin-top: 10rpx;
  color: #8b95a5;
  font-size: 25rpx;
  font-weight: 600;
}

.bell-dot {
  width: 72rpx;
  height: 72rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.86);
  color: #20b777;
  font-size: 44rpx;
  font-weight: 900;
  line-height: 70rpx;
  text-align: center;
  box-shadow: 0 14rpx 34rpx rgba(31, 74, 53, 0.08);
}

.goal-card,
.stage-card,
.card {
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 22rpx 56rpx rgba(31, 54, 43, 0.08),
    inset 0 0 0 1rpx rgba(31, 74, 53, 0.05);
}

.card {
  padding: 26rpx;
  margin-top: 24rpx;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    background 220ms ease;
}

.goal-card {
  position: relative;
  min-height: 270rpx;
  overflow: hidden;
  padding: 30rpx;
  background:
    linear-gradient(90deg, rgba(242, 255, 249, 0.96), rgba(255, 253, 225, 0.82)),
    radial-gradient(circle at 78% 26%, rgba(254, 221, 102, 0.35), transparent 30%);
  border: 1rpx solid rgba(89, 201, 140, 0.2);
}

.goal-content {
  position: relative;
  z-index: 2;
  width: 78%;
}

.eyebrow,
.card-label,
.chip-title,
.task-meta,
.progress-label {
  display: block;
  color: #8b95a5;
  font-size: 24rpx;
  font-weight: 800;
}

.green {
  color: #16a76b;
}

.purple {
  color: #7f6cf0;
}

.orange {
  color: #f0a01a;
}

.purple-text {
  color: #7f6cf0;
}

.goal-title {
  display: block;
  margin-top: 22rpx;
  color: #111827;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.18;
  letter-spacing: -0.8rpx;
}

.goal-copy,
.stage-subtitle,
.card-copy,
.criteria,
.empty,
.task-title {
  display: block;
  margin-top: 12rpx;
  font-size: 27rpx;
  line-height: 1.52;
}

.goal-copy,
.stage-subtitle,
.card-copy,
.empty {
  color: #7f8998;
}

.goal-copy {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #98a2b3;
}

.progress-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 24rpx;
}

.progress-number {
  display: block;
  margin-top: 6rpx;
  color: #23b878;
  font-size: 48rpx;
  font-weight: 900;
  letter-spacing: -1rpx;
}

.progress-score {
  color: #727b90;
  font-size: 24rpx;
  font-weight: 800;
}

.xp-track {
  height: 16rpx;
  margin-top: 16rpx;
  border-radius: 999rpx;
  background: rgba(34, 197, 122, 0.1);
  overflow: hidden;
}

.xp-track-fill {
  width: var(--plan-progress);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #25c27a, #39d895);
  box-shadow: 0 0 22rpx rgba(37, 194, 122, 0.32);
  transition: width 520ms cubic-bezier(0.2, 0.82, 0.24, 1);
}

.xp-track-glow .xp-track-fill {
  animation: xpGlow 520ms ease;
}

.goal-tip {
  display: block;
  margin-top: 22rpx;
  color: #7f8998;
  font-size: 23rpx;
  font-weight: 700;
}

.mountain-art {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 34%;
  height: 100%;
}

.sun-glow {
  position: absolute;
  right: 68rpx;
  top: 34rpx;
  width: 118rpx;
  height: 118rpx;
  border-radius: 999rpx;
  background: rgba(255, 223, 105, 0.36);
  filter: blur(8rpx);
}

.hill {
  position: absolute;
  bottom: -22rpx;
  border-radius: 999rpx 999rpx 0 0;
}

.hill-back {
  right: -72rpx;
  width: 300rpx;
  height: 188rpx;
  background: linear-gradient(180deg, rgba(152, 222, 163, 0.82), rgba(109, 203, 144, 0.62));
}

.hill-front {
  right: 72rpx;
  width: 260rpx;
  height: 164rpx;
  background: linear-gradient(180deg, rgba(177, 232, 181, 0.92), rgba(112, 207, 147, 0.74));
}

.road {
  position: absolute;
  right: 94rpx;
  bottom: 0;
  width: 48rpx;
  height: 156rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.56);
  transform: rotate(31deg);
}

.flag-pole {
  position: absolute;
  right: 88rpx;
  top: 54rpx;
  width: 6rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
}

.flag {
  position: absolute;
  right: 36rpx;
  top: 54rpx;
  width: 64rpx;
  height: 42rpx;
  border-radius: 8rpx 20rpx 18rpx 8rpx;
  background: rgba(255, 255, 255, 0.96);
  transform: skewY(7deg);
}

.empty-state {
  margin-top: 12rpx;
}

.empty-action {
  margin-top: 16rpx;
}

.stage-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 112rpx;
  margin-top: 24rpx;
  padding: 24rpx 28rpx;
}

.stage-copy {
  flex: 1;
  min-width: 0;
}

.stage-title {
  display: block;
  margin-top: 10rpx;
  color: #111827;
  font-size: 31rpx;
  font-weight: 900;
}

.ring-progress {
  width: 96rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background:
    radial-gradient(circle at center, #fff 53%, transparent 55%),
    conic-gradient(#24bd79 0deg, #24bd79 216deg, #e8eee9 216deg, #e8eee9 360deg);
  color: #111827;
  font-size: 25rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-actions {
  display: flex;
  align-items: stretch;
  gap: 18rpx;
  margin-top: 24rpx;
}

.action-button,
.secondary-button,
.mini-button,
.tiny-button,
.text-button {
  min-width: 0;
  border: none;
  font-weight: 900;
}

.action-button,
.secondary-button {
  min-height: 82rpx;
  border-radius: 28rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.action-button {
  flex: 1.08;
  color: #fff;
  background: linear-gradient(135deg, #2ed486, #16aa68);
  box-shadow:
    0 16rpx 28rpx rgba(22, 170, 104, 0.24),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.26);
}

.secondary-button {
  flex: 0.92;
  color: #765327;
  background: linear-gradient(135deg, #fff8df, #f9e6b7);
  box-shadow:
    0 12rpx 24rpx rgba(166, 124, 40, 0.12),
    inset 0 0 0 1rpx rgba(180, 130, 35, 0.08);
}

.content-grid {
  margin-top: 4rpx;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.text-button {
  min-height: 54rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #eaf8f0;
  color: #16a76b;
  font-size: 23rpx;
  box-shadow: inset 0 0 0 1rpx rgba(22, 167, 107, 0.08);
}

.muted-link {
  color: #98a2b3;
  font-size: 24rpx;
  font-weight: 800;
}

.chevron {
  width: 48rpx;
  color: #8b95a5;
  font-size: 54rpx;
  line-height: 1;
  text-align: right;
}

.card-title {
  display: block;
  margin-top: 16rpx;
  color: #111827;
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.28;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 24rpx;
}

.info-tile,
.criteria-box {
  border-radius: 22rpx;
  background: linear-gradient(135deg, #f8f7ff, #fbfaff);
  box-shadow: inset 0 0 0 1rpx rgba(127, 108, 240, 0.06);
}

.info-tile {
  min-height: 112rpx;
  padding: 18rpx;
}

.criteria-box {
  display: flex;
  gap: 14rpx;
  margin-top: 14rpx;
  padding: 18rpx;
}

.tile-icon {
  display: block;
  color: #16a76b;
  font-size: 32rpx;
  font-weight: 900;
}

.tile-copy,
.criteria {
  display: block;
  margin-top: 6rpx;
  color: #111827;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.46;
}

.chip {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #e8f2eb;
  color: #274335;
  font-size: 24rpx;
}

.chip-keyword {
  background: #f3ede0;
  color: #5a4321;
}

.quick-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 22rpx;
}

.mini-button {
  flex: 1;
  min-height: 78rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
}

.action-mini {
  color: #16a76b;
  background: #e9f8f0;
}

.done-mini {
  color: #fff;
  background: linear-gradient(135deg, #2ed486, #16aa68);
  box-shadow: 0 12rpx 24rpx rgba(22, 170, 104, 0.18);
}

.task-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 0;
  border-bottom: 1px solid rgba(108, 125, 116, 0.12);
  transition:
    transform 180ms ease,
    opacity 180ms ease,
    background 220ms ease;
}

.task-stack {
  position: relative;
  margin-top: 8rpx;
}

.task-main {
  flex: 1;
  min-width: 0;
}

.task-title {
  color: #111827;
  font-weight: 850;
  line-height: 1.38;
}

.task-meta {
  margin-top: 6rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.task-inline-actions,
.quick-actions {
  display: flex;
  gap: 12rpx;
}

.task-inline-actions {
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  width: 222rpx;
}

.task-status-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
  border: 4rpx solid #cfd6dc;
  flex-shrink: 0;
}

.task-status-todo {
  border-color: #cfd6dc;
}

.task-status-doing {
  border-color: #f5b83e;
}

.task-status-done {
  border-color: #27bd79;
  background: #27bd79;
}

.task-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.card-pulse-doing {
  transform: translateY(-2rpx);
  box-shadow: 0 22rpx 54rpx rgba(45, 106, 79, 0.12);
}

.card-pulse-done {
  transform: scale(0.99);
  background: linear-gradient(135deg, rgba(231, 243, 232, 0.92), rgba(248, 251, 247, 0.88));
}

.card-pulse-todo {
  transform: translateY(1rpx);
  background: linear-gradient(135deg, rgba(244, 240, 228, 0.92), rgba(250, 248, 241, 0.88));
}

.task-row-pulse-doing {
  transform: translateX(6rpx);
}

.task-row-pulse-done {
  opacity: 0.72;
  transform: translateX(18rpx) scale(0.98);
}

.task-row-pulse-todo {
  transform: translateX(-4rpx);
}

.task-stack-enter-active,
.task-stack-leave-active {
  transition:
    transform 240ms ease,
    opacity 220ms ease;
}

.task-stack-enter-from {
  opacity: 0;
  transform: translateY(18rpx) scale(0.98);
}

.task-stack-leave-to {
  opacity: 0;
  transform: translateX(28rpx) scale(0.96);
}

.task-stack-leave-active {
  position: absolute;
  left: 0;
  right: 0;
}

.task-stack-move {
  transition: transform 240ms ease;
}

@keyframes xpGlow {
  0% {
    filter: brightness(1);
  }
  45% {
    filter: brightness(1.35);
    box-shadow: 0 0 34rpx rgba(242, 199, 92, 0.78);
  }
  100% {
    filter: brightness(1);
  }
}

.todo-input-row,
.todo-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-top: 16rpx;
}

.todo-input-row {
  padding: 6rpx 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 250, 235, 0.82);
  box-shadow: inset 0 0 0 1rpx rgba(240, 160, 26, 0.08);
}

.todo-stack {
  position: relative;
}

.todo-row {
  padding: 16rpx 14rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 0 0 1rpx rgba(240, 160, 26, 0.08);
  transition:
    transform 180ms ease,
    opacity 180ms ease,
    box-shadow 180ms ease;
}

.todo-row-dragging {
  position: relative;
  z-index: 2;
  box-shadow: 0 18rpx 40rpx rgba(45, 106, 79, 0.14);
}

.todo-drag-handle {
  width: 52rpx;
  min-height: 64rpx;
  border-radius: 20rpx;
  background: #fff6df;
  color: #d4ad63;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-drag-mark {
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: -2rpx;
}

.todo-stack-enter-active,
.todo-stack-leave-active {
  transition:
    transform 220ms ease,
    opacity 200ms ease;
}

.todo-stack-enter-from,
.todo-stack-leave-to {
  opacity: 0;
  transform: translateY(16rpx) scale(0.98);
}

.todo-stack-move {
  transition: transform 220ms ease;
}

.todo-input {
  flex: 1;
  min-width: 0;
  min-height: 64rpx;
  padding: 0;
  border-radius: 18rpx;
  background: transparent;
  font-size: 26rpx;
}

.todo-copy {
  flex: 1;
}

.tiny-button {
  min-width: 62rpx;
  min-height: 46rpx;
  border-radius: 999rpx;
  padding: 0 14rpx;
  background: #edf6f1;
  color: #16a76b;
  font-size: 20rpx;
}

.tiny-todo {
  background: #f6f7f8;
  color: #7f8998;
}

.tiny-done {
  background: #20b777;
  color: #fff;
}

.status-selected {
  opacity: 1;
  box-shadow:
    inset 0 0 0 2rpx rgba(35, 62, 49, 0.12),
    0 8rpx 16rpx rgba(45, 106, 79, 0.12);
}

button:disabled {
  opacity: 0.58;
}

button.status-selected:disabled {
  opacity: 1;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  position: relative;
  padding: 22rpx 0 22rpx 18rpx;
}

.result-timeline {
  position: relative;
  margin-top: 14rpx;
}

.result-timeline::before {
  content: "";
  position: absolute;
  left: 28rpx;
  top: 20rpx;
  bottom: 22rpx;
  width: 2rpx;
  background: #d8efe3;
}

.result-check {
  position: relative;
  z-index: 1;
  width: 58rpx;
  height: 58rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #2fd387, #17aa69);
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 22rpx rgba(22, 170, 104, 0.18);
}

.result-main {
  flex: 1;
  min-width: 0;
}

.result-row:last-child {
  padding-bottom: 10rpx;
}

.result-badge {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #e8f8ef;
  color: #16a76b;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
