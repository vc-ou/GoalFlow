<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { deleteTask, fetchTask, updateTask, updateTaskStatus } from "../../api/tasks";
import type { ApiTask } from "../../api/types";
import { getTaskStatusToast, type TaskStatusFeedback } from "../../utils/task-feedback";

const task = ref<ApiTask | null>(null);
const taskId = ref("");
const loading = ref(false);
const planId = ref("");
const isEditing = ref(false);
const deleting = ref(false);

const form = ref({
  title: "",
  description: "",
  completion_criteria: "",
  weight: 10,
  priority: "normal",
  remark: ""
});

async function loadTask() {
  const routeTaskId = taskId.value;
  if (!routeTaskId) return;

  taskId.value = routeTaskId;
  loading.value = true;
  try {
    const data = await fetchTask(routeTaskId);
    task.value = data;
    planId.value = String((data as ApiTask & { plan_id?: string }).plan_id || "");
    form.value = {
      title: data.title,
      description: buildTaskHowTo(data),
      completion_criteria: data.completion_criteria,
      weight: data.weight,
      priority: data.priority,
      remark: data.remark
    };
    isEditing.value = false;
  } finally {
    loading.value = false;
  }
}

async function saveTask() {
  await updateTask(taskId.value, {
    title: form.value.title,
    description: form.value.description.trim(),
    execution_platforms: [],
    search_keywords: [],
    completion_criteria: form.value.completion_criteria,
    weight: Number(form.value.weight || 10),
    priority: form.value.priority,
    tags: task.value?.tags ?? [],
    remark: form.value.remark.trim(),
    sort_order: task.value?.sort_order ?? 1
  });
  uni.showToast({ title: "任务已保存", icon: "none" });
  await loadTask();
}

async function handleTaskEditorAction() {
  if (!isEditing.value) {
    isEditing.value = true;
    return;
  }

  await saveTask();
}

async function changeStatus(status: TaskStatusFeedback) {
  await updateTaskStatus(taskId.value, status);
  uni.showToast({
    title: getTaskStatusToast(status),
    icon: "none"
  });
  await loadTask();
}

async function handleDeleteTask() {
  if (!taskId.value || deleting.value) return;

  deleting.value = true;
  try {
    await deleteTask(taskId.value);
    uni.showToast({ title: "任务已删除", icon: "none" });

    if (planId.value) {
      uni.reLaunch({
        url: `/pages/plans/detail?id=${planId.value}`
      });
      return;
    }

    backToHome();
  } finally {
    deleting.value = false;
  }
}

function backToHome() {
  uni.reLaunch({
    url: "/pages/home/index"
  });
}

function backToPlan() {
  if (!planId.value) {
    backToHome();
    return;
  }

  uni.navigateTo({
    url: `/pages/plans/detail?id=${planId.value}`
  });
}

function buildTaskHowTo(data: ApiTask) {
  const blocks = [data.description.trim()];
  if (data.execution_platforms.length) {
    blocks.push(`可以先从这些地方开始：${data.execution_platforms.join("、")}`);
  }
  if (data.search_keywords.length) {
    blocks.push(`也可以直接搜这些线索：${data.search_keywords.join("、")}`);
  }

  return blocks.filter(Boolean).join("\n\n");
}

onLoad((options) => {
  taskId.value = String(options?.id ?? "");
  loadTask();
});
</script>

<template>
  <view class="page" v-if="task">
    <view class="top-nav">
      <button class="nav-button" @click="backToPlan">‹</button>
      <text class="nav-title">任务详情</text>
      <button class="nav-button nav-home" @click="backToHome">⌂</button>
    </view>

    <view class="task-hero">
      <view class="task-icon">⚡</view>
      <view class="hero-copy">
        <text class="eyebrow">当前任务</text>
        <text class="title">{{ task.title }}</text>
        <view class="hero-tags">
          <text class="status-chip">{{ task.status }}</text>
          <text class="priority-chip">优先级 {{ task.priority }}</text>
        </view>
      </view>
      <view class="hero-glow" />
    </view>

    <view class="card status-card">
      <view class="section-head">
        <view>
          <text class="section-title">任务进度</text>
          <text class="helper">切换状态后，首页推荐会自动补位。</text>
        </view>
      </view>
      <view class="actions">
        <button class="soft-button" @click="changeStatus('todo')">todo</button>
        <button class="soft-button" @click="changeStatus('doing')">doing</button>
        <button class="primary-button" @click="changeStatus('done')">done</button>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <view>
          <text class="section-title">行动说明</text>
          <text class="helper">
            {{ isEditing ? "编辑模式已开启，输入框会随内容自动展开。" : "当前先按预览展示，点编辑任务后再修改内容。" }}
          </text>
        </view>
        <button class="save-pill" :class="{ 'edit-pill-active': isEditing }" @click="handleTaskEditorAction">
          {{ isEditing ? "保存任务" : "编辑任务" }}
        </button>
      </view>
      <input v-model="form.title" :disabled="!isEditing" class="input title-input" :class="{ 'field-readonly': !isEditing }" placeholder="任务名称" />
      <textarea v-model="form.description" :disabled="!isEditing" class="textarea" :class="{ 'field-readonly': !isEditing }" auto-height placeholder="怎么做" />
      <view class="criteria-card">
        <text class="info-icon purple">◎</text>
        <view class="criteria-copy">
          <text class="info-label">完成标准</text>
          <textarea v-model="form.completion_criteria" :disabled="!isEditing" class="inline-textarea" :class="{ 'field-readonly': !isEditing }" auto-height placeholder="完成标准" />
        </view>
      </view>
      <view class="remark-card">
        <text class="info-label">补充备注</text>
        <textarea v-model="form.remark" :disabled="!isEditing" class="inline-textarea remark-textarea" :class="{ 'field-readonly': !isEditing }" auto-height placeholder="补充备注" />
      </view>
      <view v-if="isEditing" class="danger-zone">
        <text class="helper">这个任务如果不再需要，可以直接删除。</text>
        <button class="danger-button" :disabled="deleting" @click="handleDeleteTask">
          {{ deleting ? "删除中..." : "删除任务" }}
        </button>
      </view>
    </view>

    <view class="card bottom-card">
      <view class="back-actions">
        <button class="plan-button" @click="backToPlan">回计划继续维护</button>
        <button class="home-button" @click="backToHome">回首页继续推进</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 34rpx 28rpx 132rpx;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72rpx;
  margin-bottom: 20rpx;
}

.nav-button {
  width: 70rpx;
  height: 70rpx;
  border: none;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  font-size: 40rpx;
  font-weight: 900;
  box-shadow: 0 12rpx 30rpx rgba(31, 54, 43, 0.08);
}

.nav-home {
  color: #20b777;
  font-size: 34rpx;
}

.nav-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 900;
}

.task-hero,
.card {
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.93);
  box-shadow:
    0 22rpx 56rpx rgba(31, 54, 43, 0.08),
    inset 0 0 0 1rpx rgba(31, 74, 53, 0.05);
}

.task-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 22rpx;
  min-height: 210rpx;
  padding: 30rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 22%, rgba(126, 220, 160, 0.42), transparent 26%),
    linear-gradient(135deg, #f4fff8, #fff9df);
  border: 1rpx solid rgba(89, 201, 140, 0.18);
}

.card {
  padding: 26rpx;
  margin-top: 24rpx;
}

.task-icon {
  width: 102rpx;
  height: 102rpx;
  border-radius: 34rpx;
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  font-size: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 30rpx rgba(22, 170, 104, 0.22);
  flex-shrink: 0;
}

.hero-copy {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.hero-glow {
  position: absolute;
  right: -28rpx;
  bottom: -36rpx;
  width: 210rpx;
  height: 148rpx;
  border-radius: 999rpx 999rpx 0 0;
  background: linear-gradient(180deg, rgba(158, 226, 166, 0.74), rgba(112, 207, 147, 0.42));
}

.eyebrow,
.helper,
.copy,
.info-label {
  display: block;
  color: #8b95a5;
  font-size: 24rpx;
  font-weight: 750;
}

.title {
  display: block;
  margin-top: 10rpx;
  color: #111827;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: -0.6rpx;
}

.hero-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-top: 18rpx;
}

.status-chip,
.priority-chip {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
  font-weight: 900;
}

.status-chip {
  color: #16a76b;
  background: #e8f8ef;
}

.priority-chip {
  color: #7f6cf0;
  background: #f2efff;
}

.section-title {
  display: block;
  color: #111827;
  font-size: 31rpx;
  font-weight: 900;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.helper {
  margin-top: 8rpx;
  line-height: 1.45;
}

.copy {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #6c7d74;
}

.input,
.textarea,
.inline-textarea {
  width: 100%;
  border-radius: 22rpx;
  background: #f8faf8;
  font-size: 27rpx;
}

.input,
.textarea {
  margin-top: 16rpx;
  padding: 0 22rpx;
  box-shadow: inset 0 0 0 1rpx rgba(31, 74, 53, 0.05);
}

.input {
  height: 60rpx;
  line-height: 60rpx;
}

.title-input {
  color: #111827;
  font-weight: 850;
}

.textarea {
  min-height: 60rpx;
  padding-top: 12rpx;
  padding-bottom: 12rpx;
  line-height: 1.38;
}

.actions {
  display: flex;
  gap: 14rpx;
  margin-top: 20rpx;
}

.primary-button,
.soft-button,
.save-pill,
.danger-button,
.plan-button,
.home-button {
  flex: 1;
  border: none;
  border-radius: 26rpx;
  min-height: 78rpx;
  font-size: 26rpx;
  font-weight: 900;
}

.primary-button {
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  box-shadow: 0 14rpx 26rpx rgba(22, 170, 104, 0.2);
}

.soft-button {
  background: #edf8f2;
  color: #16a76b;
}

.danger-button {
  background: #f5e5df;
  color: #9a4b2f;
}

.save-pill {
  flex: 0 0 148rpx;
  min-height: 60rpx;
  border-radius: 999rpx;
  background: #e8f8ef;
  color: #16a76b;
  font-size: 23rpx;
}

.edit-pill-active {
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
}

.criteria-card,
.remark-card {
  border-radius: 24rpx;
  background: linear-gradient(135deg, #f8f7ff, #fbfaff);
  box-shadow: inset 0 0 0 1rpx rgba(127, 108, 240, 0.06);
}

.criteria-card {
  display: flex;
  gap: 14rpx;
  margin-top: 14rpx;
  padding: 18rpx;
}

.remark-card {
  margin-top: 14rpx;
  padding: 18rpx;
  background: #f8faf8;
}

.info-icon {
  display: block;
  color: #16a76b;
  font-size: 32rpx;
  font-weight: 900;
}

.purple {
  color: #7f6cf0;
}

.inline-textarea {
  margin-top: 8rpx;
  padding: 0;
  color: #111827;
  background: transparent;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.45;
}

.inline-textarea {
  min-height: 60rpx;
}

.remark-textarea {
  margin-top: 12rpx;
}

.danger-zone {
  margin-top: 18rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #fff8f4, #fff2eb);
  box-shadow: inset 0 0 0 1rpx rgba(154, 75, 47, 0.08);
}

.field-readonly {
  opacity: 1;
}

.criteria-copy {
  flex: 1;
  min-width: 0;
}

.back-actions {
  display: flex;
  gap: 16rpx;
}

.plan-button {
  color: #16a76b;
  background: #e8f8ef;
}

.home-button {
  color: #765327;
  background: linear-gradient(135deg, #fff8df, #f9e6b7);
}

.bottom-card {
  background: rgba(255, 255, 255, 0.78);
}
</style>
