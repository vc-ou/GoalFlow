<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { createMilestone, deleteMilestone, updateMilestone } from "../../api/milestones";
import { createTask, updateTask, updateTaskStatus } from "../../api/tasks";
import { deletePlan, fetchPlanDetail, setCurrentPlan, updatePlan, updatePlanStatus } from "../../api/plans";
import type { ApiMilestone, ApiPlan, ApiTask } from "../../api/types";
import { getTaskStatusToast, type TaskStatusFeedback } from "../../utils/task-feedback";

const plan = ref<ApiPlan | null>(null);
const loading = ref(false);
const planId = ref("");
const activeMilestoneId = ref("");
const actionPendingTaskId = ref("");
const actionPendingMilestoneId = ref("");
const actionPendingPlan = ref(false);
const actionPendingCurrentPlan = ref(false);
const currentPlanId = ref("");
const showMilestoneManager = ref(false);
const showCreateAction = ref(false);
const dragState = ref({
  type: "",
  id: "",
  startY: 0,
  offsetY: 0
});
const milestoneForm = ref({
  title: "",
  description: ""
});

const planForm = ref({
  title: "",
  goal: ""
});

const taskForm = ref({
  milestone_id: "",
  title: "",
  description: "",
  execution_platforms: "",
  search_keywords: "",
  completion_criteria: "",
  weight: 10,
  priority: "normal",
  remark: ""
});

const isCurrentPlan = computed(() => {
  return Boolean(plan.value?.is_current || (planId.value && currentPlanId.value === planId.value));
});

async function loadPlan() {
  const routePlanId = planId.value;
  if (!routePlanId) return;

  planId.value = routePlanId;
  currentPlanId.value = String(uni.getStorageSync("current_plan_id") || "");
  loading.value = true;
  try {
    const detail = await fetchPlanDetail(routePlanId);
    plan.value = {
      ...detail,
      is_current: Boolean(detail.is_current || currentPlanId.value === routePlanId)
    };
    planForm.value = {
      title: plan.value.title,
      goal: plan.value.goal
    };
    const milestone = plan.value.milestones?.[0];
    taskForm.value.milestone_id = milestone?.id ?? milestone?._id ?? "";
    if (!activeMilestoneId.value && taskForm.value.milestone_id) {
      activeMilestoneId.value = taskForm.value.milestone_id;
    }
  } finally {
    loading.value = false;
  }
}

async function handleSetCurrent() {
  if (isCurrentPlan.value) return;

  actionPendingCurrentPlan.value = true;
  try {
    await setCurrentPlan(planId.value);
    currentPlanId.value = planId.value;
    plan.value = plan.value ? { ...plan.value, is_current: true } : plan.value;
    await loadPlan();
    currentPlanId.value = planId.value;
    plan.value = plan.value ? { ...plan.value, is_current: true } : plan.value;
    uni.showToast({ title: "已设为当前计划", icon: "none" });
  } finally {
    actionPendingCurrentPlan.value = false;
  }
}

async function handleSavePlan() {
  if (!planForm.value.title.trim()) {
    uni.showToast({ title: "请先填写计划名称", icon: "none" });
    return;
  }

  actionPendingPlan.value = true;
  try {
    await updatePlan(planId.value, {
      title: planForm.value.title.trim(),
      goal: planForm.value.goal.trim(),
      cover_color: plan.value?.cover_color ?? "green",
      tags: (plan.value as ApiPlan & { tags?: string[] } | null)?.tags ?? []
    });
    await loadPlan();
    uni.showToast({ title: "计划已保存", icon: "none" });
  } finally {
    actionPendingPlan.value = false;
  }
}

async function handleArchivePlan() {
  actionPendingPlan.value = true;
  try {
    const nextStatus = plan.value?.status === "archived" ? "active" : "archived";
    await updatePlanStatus(planId.value, nextStatus);
    await loadPlan();
    uni.showToast({ title: nextStatus === "archived" ? "路线已归档" : "路线已恢复", icon: "none" });
  } finally {
    actionPendingPlan.value = false;
  }
}

async function handleDeletePlan() {
  actionPendingPlan.value = true;
  try {
    await deletePlan(planId.value);
    uni.showToast({ title: "路线已删除", icon: "none" });
    uni.switchTab({ url: "/pages/plans/index" });
  } finally {
    actionPendingPlan.value = false;
  }
}

function goReviews() {
  uni.navigateTo({
    url: "/pages/reviews/index"
  });
}

async function handleCreateTask() {
  if (!taskForm.value.title || !taskForm.value.milestone_id) {
    uni.showToast({ title: "请先填写任务标题", icon: "none" });
    return;
  }

  await createTask({
    plan_id: planId.value,
    milestone_id: taskForm.value.milestone_id,
    title: taskForm.value.title,
    description: taskForm.value.description,
    execution_platforms: splitInput(taskForm.value.execution_platforms),
    search_keywords: splitInput(taskForm.value.search_keywords),
    completion_criteria: taskForm.value.completion_criteria,
    weight: Number(taskForm.value.weight || 10),
    priority: taskForm.value.priority,
    tags: [],
    remark: taskForm.value.remark,
    sort_order: nextSortOrder()
  });

  await setCurrentPlan(planId.value);
  uni.showToast({ title: "任务已创建，已同步到首页", icon: "none" });
  taskForm.value.title = "";
  taskForm.value.description = "";
  taskForm.value.execution_platforms = "";
  taskForm.value.search_keywords = "";
  taskForm.value.completion_criteria = "";
  taskForm.value.remark = "";
  await loadPlan();
  showCreateAction.value = false;
}

async function handleCreateMilestone() {
  if (!milestoneForm.value.title.trim()) {
    uni.showToast({ title: "请先填写阶段名称", icon: "none" });
    return;
  }

  await createMilestone({
    plan_id: planId.value,
    title: milestoneForm.value.title.trim(),
    description: milestoneForm.value.description.trim(),
    sort_order: (milestones.value.length || 0) + 1
  });

  milestoneForm.value.title = "";
  milestoneForm.value.description = "";
  await loadPlan();
  uni.showToast({ title: "阶段已创建", icon: "none" });
}

function goTask(taskId: string) {
  uni.navigateTo({
    url: `/pages/tasks/detail?id=${taskId}`
  });
}

function selectMilestone(milestone: ApiMilestone) {
  const id = String(milestone.id || milestone._id || "");
  activeMilestoneId.value = id;
  taskForm.value.milestone_id = id;
}

async function saveMilestone(milestone: ApiMilestone) {
  const milestoneId = String(milestone.id || milestone._id || "");
  if (!milestoneId) return;

  actionPendingMilestoneId.value = milestoneId;
  try {
    await updateMilestone(milestoneId, {
      title: milestone.title,
      description: milestone.description,
      sort_order: milestone.sort_order
    });
    await loadPlan();
    uni.showToast({ title: "阶段已保存", icon: "none" });
  } finally {
    actionPendingMilestoneId.value = "";
  }
}

async function reorderMilestone(milestone: ApiMilestone, targetIndex: number) {
  const sortedMilestones = [...milestones.value].sort((a, b) => a.sort_order - b.sort_order);
  const index = sortedMilestones.findIndex((item) => String(item.id || item._id) === String(milestone.id || milestone._id));
  if (index === -1) return;

  const nextIndex = Math.max(0, Math.min(targetIndex, sortedMilestones.length - 1));
  if (nextIndex === index) return;

  const [moved] = sortedMilestones.splice(index, 1);
  sortedMilestones.splice(nextIndex, 0, moved);

  await Promise.all(
    sortedMilestones.map((item, itemIndex) =>
      updateMilestone(String(item.id || item._id), {
        title: item.title,
        description: item.description,
        sort_order: itemIndex + 1
      })
    )
  );

  await loadPlan();
  uni.showToast({ title: "阶段顺序已更新", icon: "none" });
}

async function removeMilestone(milestone: ApiMilestone) {
  const milestoneId = String(milestone.id || milestone._id || "");
  if (!milestoneId) return;

  actionPendingMilestoneId.value = milestoneId;
  try {
    await deleteMilestone(milestoneId);
    if (activeMilestoneId.value === milestoneId) {
      activeMilestoneId.value = "";
    }
    await loadPlan();
    uni.showToast({ title: "阶段已删除", icon: "none" });
  } finally {
    actionPendingMilestoneId.value = "";
  }
}

async function reorderTask(task: ApiTask, targetIndex: number) {
  const milestone = activeMilestone.value;
  if (!milestone?.tasks?.length) return;

  const tasks = [...milestone.tasks].sort((a, b) => a.sort_order - b.sort_order);
  const index = tasks.findIndex((item) => String(item.id || item._id) === String(task.id || task._id));
  if (index === -1) return;

  const nextIndex = Math.max(0, Math.min(targetIndex, tasks.length - 1));
  if (nextIndex === index) return;

  const [moved] = tasks.splice(index, 1);
  tasks.splice(nextIndex, 0, moved);

  await Promise.all(
    tasks.map((item, itemIndex) =>
      updateTask(String(item.id || item._id), {
        title: item.title,
        description: item.description,
        execution_platforms: item.execution_platforms,
        search_keywords: item.search_keywords,
        completion_criteria: item.completion_criteria,
        weight: item.weight,
        priority: item.priority,
        tags: item.tags,
        remark: item.remark,
        sort_order: itemIndex + 1
      })
    )
  );

  await loadPlan();
  uni.showToast({ title: "任务顺序已更新", icon: "none" });
}

async function quickSetTaskStatus(task: ApiTask, status: TaskStatusFeedback) {
  if (task.status === status) return;

  const previousPlan = plan.value ? JSON.parse(JSON.stringify(plan.value)) : null;
  const taskId = String(task.id || task._id);
  actionPendingTaskId.value = taskId;
  applyOptimisticPlanStatus(taskId, status);

  try {
    await updateTaskStatus(taskId, status);
    await loadPlan();
    uni.showToast({
      title: getTaskStatusToast(status),
      icon: "none"
    });
  } catch {
    plan.value = previousPlan;
    uni.showToast({
      title: "状态更新失败，请重试",
      icon: "none"
    });
  } finally {
    actionPendingTaskId.value = "";
  }
}

function splitInput(value: string) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function startDrag(type: "milestone" | "task", id: string, event: TouchEvent) {
  dragState.value = {
    type,
    id,
    startY: getTouchY(event),
    offsetY: 0
  };
}

function updateDrag(event: TouchEvent) {
  if (!dragState.value.id) return;

  dragState.value.offsetY = getTouchY(event) - dragState.value.startY;
}

async function finishMilestoneDrag(milestone: ApiMilestone) {
  const drag = dragState.value;
  clearDrag();
  if (drag.type !== "milestone" || drag.id !== String(milestone.id || milestone._id)) return;

  const sortedMilestones = [...milestones.value].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = sortedMilestones.findIndex((item) => String(item.id || item._id) === String(milestone.id || milestone._id));
  const targetIndex = currentIndex + getDragStep(drag.offsetY);
  await reorderMilestone(milestone, targetIndex);
}

async function finishTaskDrag(task: ApiTask) {
  const drag = dragState.value;
  clearDrag();
  if (drag.type !== "task" || drag.id !== String(task.id || task._id)) return;

  const tasks = [...(activeMilestone.value?.tasks || [])].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = tasks.findIndex((item) => String(item.id || item._id) === String(task.id || task._id));
  const targetIndex = currentIndex + getDragStep(drag.offsetY);
  await reorderTask(task, targetIndex);
}

function getDragStep(offsetY: number) {
  const step = Math.trunc(Math.abs(offsetY) / 56);
  if (step === 0) return 0;
  return offsetY > 0 ? step : -step;
}

function getTouchY(event: TouchEvent) {
  return event.changedTouches?.[0]?.clientY ?? event.touches?.[0]?.clientY ?? 0;
}

function getDragStyle(type: "milestone" | "task", id: string) {
  if (dragState.value.type !== type || dragState.value.id !== id) return "";
  const offset = Math.max(-140, Math.min(140, dragState.value.offsetY));
  return `transform: translateY(${offset}px);`;
}

function clearDrag() {
  dragState.value = {
    type: "",
    id: "",
    startY: 0,
    offsetY: 0
  };
}

const milestones = computed(() => plan.value?.milestones || []);

const currentMilestoneId = computed(() => {
  const milestone = milestones.value.find((item) =>
    (item.tasks || []).some((task) => task.status !== "done")
  );
  return String(milestone?.id || milestone?._id || milestones.value[0]?.id || milestones.value[0]?._id || "");
});

const milestoneProgressItems = computed(() => {
  const currentIndex = milestones.value.findIndex((milestone) => String(milestone.id || milestone._id) === currentMilestoneId.value);

  return milestones.value
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((milestone, index) => {
      const tasks = milestone.tasks || [];
      const doneCount = tasks.filter((task) => task.status === "done").length;
      const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
      const id = String(milestone.id || milestone._id || "");
      const isActive = activeMilestoneId.value === id;
      const isCurrent = currentMilestoneId.value === id;
      const state = isCurrent ? "current" : index < currentIndex ? "done" : "upcoming";

      return {
        id,
        milestone,
        index,
        progress,
        isActive,
        isCurrent,
        state
      };
    });
});

const activeMilestone = computed(() => {
  return milestones.value.find((milestone) => String(milestone.id || milestone._id) === activeMilestoneId.value) ?? milestones.value[0] ?? null;
});

function nextSortOrder() {
  return (activeMilestone.value?.tasks?.length ?? 0) + 1;
}

function applyOptimisticPlanStatus(taskId: string, status: TaskStatusFeedback) {
  if (!plan.value?.milestones) return;

  plan.value.milestones.forEach((milestone) => {
    milestone.tasks?.forEach((task) => {
      if (String(task.id || task._id) === taskId) {
        task.status = status;
      }
    });
  });
}

onLoad((options) => {
  planId.value = String(options?.id ?? "");
  loadPlan();
});
</script>

<template>
  <view class="page">
    <view class="hero" v-if="plan">
      <text class="eyebrow">计划详情</text>
      <text class="title">{{ plan.title }}</text>
      <text class="copy">{{ plan.goal }}</text>
      <view class="hero-actions">
        <button
          class="soft-button"
          :class="{ 'current-plan-button': isCurrentPlan }"
          :disabled="isCurrentPlan || actionPendingCurrentPlan"
          @click="handleSetCurrent"
        >
          {{ isCurrentPlan ? "已是当前计划" : actionPendingCurrentPlan ? "设置中..." : "设为当前计划" }}
        </button>
        <button class="outline-button" @click="goReviews">写阶段复盘</button>
      </view>
    </view>

    <view class="card" v-if="plan">
      <text class="section-title">编辑路线</text>
      <input v-model="planForm.title" class="input" placeholder="计划名称" />
      <textarea v-model="planForm.goal" class="textarea textarea-compact" auto-height placeholder="最终目标" />
      <view class="task-actions">
        <button class="soft-button inline-button" :disabled="actionPendingPlan" @click="handleSavePlan">保存路线</button>
        <button class="outline-button inline-button" :disabled="actionPendingPlan" @click="handleArchivePlan">
          {{ plan.status === "archived" ? "恢复路线" : "归档路线" }}
        </button>
        <button class="danger-button inline-button" :disabled="actionPendingPlan" @click="handleDeletePlan">删除路线</button>
      </view>
    </view>

    <view class="card" v-if="plan">
      <view class="section-head">
        <view>
          <text class="section-title">关卡路线</text>
          <text class="section-hint">点击节点查看对应阶段，日常推进只看当前阶段任务。</text>
        </view>
        <button class="text-pill-button" @click="showMilestoneManager = !showMilestoneManager">
          {{ showMilestoneManager ? "收起管理" : "管理阶段" }}
        </button>
      </view>
      <view class="milestone-roadmap">
        <button
          v-for="item in milestoneProgressItems"
          :key="item.id"
          class="roadmap-node"
          :class="{
            'roadmap-node-active': item.isActive,
            'roadmap-node-current': item.isCurrent,
            'roadmap-node-done': item.state === 'done',
            'roadmap-node-upcoming': item.state === 'upcoming'
          }"
          @click="selectMilestone(item.milestone)"
        >
          <view class="node-dot">
            <text>{{ item.index + 1 }}</text>
          </view>
          <view class="node-copy">
            <text class="node-title">{{ item.milestone.title }}</text>
            <text class="node-meta">{{ item.isCurrent ? "当前推进" : `${item.progress}%` }}</text>
            <view class="node-progress">
              <view class="node-progress-fill" :style="{ width: `${item.isCurrent ? Math.max(item.progress, 12) : item.progress}%` }" />
            </view>
          </view>
        </button>
      </view>

      <view v-if="activeMilestone" class="milestone current-stage-panel">
        <view class="milestone-header">
          <text class="milestone-title">{{ activeMilestone.title }}</text>
          <text
            v-if="currentMilestoneId === String(activeMilestone.id || activeMilestone._id)"
            class="current-badge"
          >
            当前推进阶段
          </text>
        </view>
        <text class="copy">{{ activeMilestone.description }}</text>
        <view
          v-for="task in (activeMilestone.tasks || []).slice().sort((a, b) => a.sort_order - b.sort_order)"
          :key="task.id || task._id"
          class="task-row"
          :class="{ 'dragging-card': dragState.type === 'task' && dragState.id === String(task.id || task._id) }"
          :style="getDragStyle('task', String(task.id || task._id))"
        >
          <view
            class="drag-handle"
            @touchstart="startDrag('task', String(task.id || task._id), $event)"
            @touchmove.stop.prevent="updateDrag"
            @touchend="finishTaskDrag(task)"
          >
            <text class="drag-handle-mark">::</text>
            <text class="drag-handle-copy">按住拖动排序</text>
          </view>
          <view class="task-main" @click="goTask(String(task.id || task._id))">
            <text class="task-name">{{ task.title }}</text>
            <text class="task-meta">{{ task.status }} · {{ task.priority }}</text>
          </view>
          <view class="task-actions">
            <button class="status-button" :class="{ 'status-button-selected': task.status === 'todo' }" :disabled="actionPendingTaskId === String(task.id || task._id) || task.status === 'todo'" @click="quickSetTaskStatus(task, 'todo')">todo</button>
            <button class="status-button status-button-doing" :class="{ 'status-button-selected': task.status === 'doing' }" :disabled="actionPendingTaskId === String(task.id || task._id) || task.status === 'doing'" @click="quickSetTaskStatus(task, 'doing')">doing</button>
            <button class="status-button status-button-done" :class="{ 'status-button-selected': task.status === 'done' }" :disabled="actionPendingTaskId === String(task.id || task._id) || task.status === 'done'" @click="quickSetTaskStatus(task, 'done')">done</button>
          </view>
        </view>
      </view>
      <text v-else class="empty-copy">还没有可展示的当前阶段，先新增一个阶段，再把今天最值得推进的任务放进去。</text>

      <view v-if="showMilestoneManager" class="milestone-manager">
        <text class="manager-title">阶段管理</text>
        <text class="section-hint">这里用于修改阶段名称、描述和排序；平时推进可以收起。</text>
        <view class="milestone-editor-list">
          <view
            v-for="milestone in milestones.slice().sort((a, b) => a.sort_order - b.sort_order)"
            :key="`editor-${milestone.id || milestone._id}`"
            class="milestone-editor"
            :class="{ 'dragging-card': dragState.type === 'milestone' && dragState.id === String(milestone.id || milestone._id) }"
            :style="getDragStyle('milestone', String(milestone.id || milestone._id))"
          >
            <view
              class="drag-handle drag-handle-compact"
              @touchstart="startDrag('milestone', String(milestone.id || milestone._id), $event)"
              @touchmove.stop.prevent="updateDrag"
              @touchend="finishMilestoneDrag(milestone)"
            >
              <text class="drag-handle-mark">::</text>
              <text class="drag-handle-copy">按住拖动排序</text>
            </view>
            <input v-model="milestone.title" class="input" placeholder="阶段名称" />
            <textarea v-model="milestone.description" class="textarea textarea-compact" auto-height placeholder="阶段描述" />
            <view class="task-actions">
              <button class="status-button status-button-doing" :disabled="actionPendingMilestoneId === String(milestone.id || milestone._id)" @click="saveMilestone(milestone)">保存</button>
              <button class="danger-button" :disabled="actionPendingMilestoneId === String(milestone.id || milestone._id)" @click="removeMilestone(milestone)">删除</button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="card collapsed-card">
      <view class="section-head">
        <view>
          <text class="section-title">新增行动</text>
          <text class="section-hint">先确定任务属于哪个阶段，再把具体行动放进去。</text>
        </view>
        <button class="text-pill-button" @click="showCreateAction = !showCreateAction">
          {{ showCreateAction ? "收起" : "展开" }}
        </button>
      </view>
      <view v-if="showCreateAction" class="collapsed-body action-builder">
        <view class="builder-block">
          <view class="builder-step">
            <text class="builder-step-index">1</text>
            <text class="builder-step-title">阶段</text>
          </view>
          <text class="section-hint">阶段是地图关卡。新任务会默认放入当前选中的阶段。</text>
          <input v-model="milestoneForm.title" class="input" placeholder="新阶段名称（可选）" />
          <textarea v-model="milestoneForm.description" class="textarea textarea-compact" auto-height placeholder="阶段描述（可选）" />
          <button class="soft-button compact-create-button" @click="handleCreateMilestone">先创建阶段</button>
        </view>

        <view class="builder-block">
          <view class="builder-step">
            <text class="builder-step-index">2</text>
            <text class="builder-step-title">任务</text>
          </view>
          <text class="section-hint">当前归属：{{ activeMilestone?.title ?? "请先创建阶段" }}</text>
        <input v-model="taskForm.title" class="input" placeholder="任务名称" />
        <textarea v-model="taskForm.description" class="textarea" auto-height placeholder="怎么做" />
        <input v-model="taskForm.execution_platforms" class="input" placeholder="执行平台，用逗号分隔" />
        <input v-model="taskForm.search_keywords" class="input" placeholder="搜索关键词，用逗号分隔" />
        <textarea v-model="taskForm.completion_criteria" class="textarea" auto-height placeholder="完成标准" />
        <input v-model="taskForm.remark" class="input" placeholder="补充备注" />
        <button class="primary-button" @click="handleCreateTask">创建任务</button>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading">加载中...</view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 34rpx 28rpx 132rpx;
}

.hero,
.card {
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.93);
  box-shadow:
    0 22rpx 56rpx rgba(31, 54, 43, 0.08),
    inset 0 0 0 1rpx rgba(31, 74, 53, 0.05);
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 30rpx;
  background:
    radial-gradient(circle at 88% 18%, rgba(255, 223, 105, 0.34), transparent 27%),
    linear-gradient(135deg, #f4fff8, #fff9df);
  border: 1rpx solid rgba(89, 201, 140, 0.18);
}

.card {
  padding: 26rpx;
  margin-top: 24rpx;
}

.collapsed-card {
  padding: 24rpx 28rpx;
}

.collapsed-body {
  margin-top: 14rpx;
}

.action-builder {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.builder-block {
  padding: 18rpx;
  border-radius: 24rpx;
  background: rgba(247, 248, 244, 0.8);
  box-shadow: inset 0 0 0 1px rgba(45, 106, 79, 0.05);
}

.builder-step {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.builder-step-index {
  width: 34rpx;
  height: 34rpx;
  border-radius: 12rpx;
  background: #2d6a4f;
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  text-align: center;
  line-height: 34rpx;
}

.builder-step-title {
  color: #2f4638;
  font-size: 28rpx;
  font-weight: 800;
}

.eyebrow,
.task-meta,
.copy {
  color: #8b95a5;
}

.title,
.section-title,
.milestone-title,
.task-name {
  display: block;
}

.title {
  margin-top: 12rpx;
  color: #111827;
  font-size: 42rpx;
  font-weight: 900;
  letter-spacing: -0.8rpx;
}

.section-title {
  color: #111827;
  font-size: 32rpx;
  font-weight: 900;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.section-hint {
  display: block;
  margin-top: 8rpx;
  color: #98a2b3;
  font-size: 23rpx;
  line-height: 1.45;
}

.copy,
.task-meta {
  font-size: 26rpx;
  margin-top: 10rpx;
}

.milestone {
  margin-top: 22rpx;
}

.milestone-editor-list {
  margin-top: 16rpx;
}

.milestone-editor {
  margin-top: 12rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: #f8faf8;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.milestone-title {
  font-size: 30rpx;
  font-weight: 600;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.hero-actions {
  display: flex;
  align-items: stretch;
  gap: 18rpx;
  margin-top: 26rpx;
}

.status-button {
  border: none;
  border-radius: 999rpx;
}

.current-badge {
  padding: 9rpx 16rpx;
  border-radius: 999rpx;
  background: #e8f8ef;
  color: #16a76b;
  font-size: 22rpx;
  white-space: nowrap;
}

.text-pill-button {
  flex-shrink: 0;
  min-height: 54rpx;
  padding: 0 18rpx;
  border: none;
  border-radius: 999rpx;
  background: #e8f8ef;
  color: #16a76b;
  font-size: 22rpx;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgba(45, 106, 79, 0.06);
}

.milestone-roadmap {
  display: flex;
  gap: 14rpx;
  margin-top: 20rpx;
  padding: 12rpx;
  border-radius: 26rpx;
  background: linear-gradient(135deg, rgba(248, 255, 249, 0.96), rgba(255, 253, 244, 0.9));
  box-shadow: inset 0 0 0 1px rgba(45, 106, 79, 0.06);
  overflow-x: auto;
}

.roadmap-node {
  position: relative;
  flex: 0 0 240rpx;
  min-height: 118rpx;
  padding: 16rpx;
  border: none;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.7);
  color: #50675b;
  display: flex;
  align-items: center;
  gap: 14rpx;
  box-shadow: inset 0 0 0 1px rgba(108, 125, 116, 0.08);
}

.roadmap-node::before {
  content: "";
  position: absolute;
  left: -22rpx;
  top: 50%;
  width: 22rpx;
  height: 4rpx;
  background: rgba(45, 106, 79, 0.16);
}

.roadmap-node:first-child::before {
  display: none;
}

.roadmap-node-active {
  background: #ffffff;
  box-shadow:
    0 14rpx 30rpx rgba(22, 170, 104, 0.12),
    inset 0 0 0 2rpx rgba(22, 167, 107, 0.12);
}

.roadmap-node-current {
  color: #213429;
}

.roadmap-node-done .node-dot,
.roadmap-node-current .node-dot {
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
}

.roadmap-node-upcoming {
  opacity: 0.86;
}

.node-dot {
  width: 58rpx;
  height: 58rpx;
  border-radius: 22rpx;
  background: #e4ece6;
  color: #6c7d74;
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.node-copy {
  flex: 1;
  min-width: 0;
}

.node-title,
.node-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-title {
  font-size: 24rpx;
  font-weight: 800;
}

.node-meta {
  margin-top: 6rpx;
  color: #7a877f;
  font-size: 21rpx;
}

.node-progress {
  height: 8rpx;
  margin-top: 10rpx;
  border-radius: 999rpx;
  background: rgba(45, 106, 79, 0.12);
  overflow: hidden;
}

.node-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #25c27a, #39d895);
  transition: width 260ms ease;
}

.current-stage-panel {
  padding: 22rpx;
  border-radius: 24rpx;
  background:
    linear-gradient(135deg, rgba(248, 255, 249, 0.94), rgba(255, 253, 244, 0.9));
  box-shadow: inset 0 0 0 1rpx rgba(22, 167, 107, 0.06);
}

.milestone-manager {
  margin-top: 22rpx;
  padding-top: 20rpx;
  border-top: 1px solid rgba(108, 125, 116, 0.12);
}

.manager-title {
  display: block;
  color: #2f4638;
  font-size: 28rpx;
  font-weight: 800;
}

.task-row {
  margin-top: 16rpx;
  padding: 18rpx 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 0 0 1px rgba(108, 125, 116, 0.07);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.task-main {
  flex: 1;
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
  color: #8a988f;
}

.drag-handle-compact {
  margin-bottom: 8rpx;
}

.drag-handle-mark {
  width: 30rpx;
  height: 30rpx;
  border-radius: 9rpx;
  background: #e8f8ef;
  color: #16a76b;
  font-size: 22rpx;
  font-weight: 700;
  text-align: center;
  line-height: 30rpx;
}

.drag-handle-copy {
  color: #9aa49d;
  font-size: 21rpx;
}

.dragging-card {
  position: relative;
  z-index: 3;
  background: #fffdf5;
  box-shadow: 0 18rpx 42rpx rgba(35, 62, 49, 0.16);
}

.task-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.status-button {
  background: #f6f7f8;
  color: #7f8998;
  font-size: 24rpx;
  min-height: 62rpx;
  padding: 0 22rpx;
  font-weight: 650;
  box-shadow: inset 0 0 0 1px rgba(45, 106, 79, 0.05);
}

.status-button-doing {
  background: #fff5db;
  color: #f0a01a;
}

.status-button-done {
  background: #20b777;
  color: #fff;
}

.status-button-selected {
  opacity: 1;
  box-shadow:
    inset 0 0 0 2rpx rgba(35, 62, 49, 0.12),
    0 8rpx 16rpx rgba(45, 106, 79, 0.12);
}

.danger-button {
  border: none;
  border-radius: 999rpx;
  background: #f4e5df;
  color: #9a4b2f;
  font-size: 24rpx;
  min-height: 62rpx;
  padding: 0 22rpx;
  font-weight: 650;
}

button:disabled {
  opacity: 0.55;
}

button.status-button-selected:disabled {
  opacity: 1;
}

.input,
.textarea {
  width: 100%;
  margin-top: 16rpx;
  padding: 0 22rpx;
  border-radius: 22rpx;
  background: #f8faf8;
  font-size: 27rpx;
  box-shadow: inset 0 0 0 1rpx rgba(31, 74, 53, 0.05);
}

.input {
  height: 58rpx;
  line-height: 58rpx;
}

.textarea {
  min-height: 58rpx;
  padding-top: 12rpx;
  padding-bottom: 12rpx;
  line-height: 1.35;
}

.textarea-compact {
  min-height: 58rpx;
}

.primary-button,
.soft-button {
  margin-top: 20rpx;
  border: none;
  border-radius: 28rpx;
  min-height: 82rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  font-weight: 800;
  letter-spacing: 0.5rpx;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.primary-button {
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  box-shadow:
    0 12rpx 22rpx rgba(45, 106, 79, 0.22),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.16);
}

.soft-button {
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  box-shadow:
    0 12rpx 22rpx rgba(45, 106, 79, 0.2),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.18);
}

.current-plan-button {
  background: linear-gradient(135deg, #e8f8ef, #dcf2e6);
  color: #16a76b;
  box-shadow:
    inset 0 0 0 2rpx rgba(45, 106, 79, 0.1),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.7);
}

.outline-button {
  margin-top: 20rpx;
  border: none;
  border-radius: 28rpx;
  min-height: 82rpx;
  padding: 0 30rpx;
  background:
    linear-gradient(135deg, rgba(255, 253, 247, 0.98), rgba(244, 235, 218, 0.96));
  color: #765327;
  font-size: 28rpx;
  font-weight: 800;
  letter-spacing: 0.5rpx;
  box-shadow:
    0 10rpx 20rpx rgba(116, 86, 38, 0.1),
    inset 0 0 0 2rpx rgba(128, 96, 47, 0.08),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.72);
}

.inline-button {
  flex: 1;
  margin-top: 0;
  min-height: 72rpx;
  font-size: 24rpx;
  border-radius: 24rpx;
  padding: 0 18rpx;
}

.compact-create-button {
  min-height: 70rpx;
  font-size: 25rpx;
}

.loading {
  margin-top: 20rpx;
  color: #6c7d74;
}

.empty-copy {
  display: block;
  margin-top: 18rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #6c7d74;
}
</style>
