<script setup lang="ts">
import { onMounted, ref } from "vue";
import { createPlan, fetchPlans } from "../../api/plans";
import { ensureDemoLogin } from "../../api/auth";
import type { ApiPlan } from "../../api/types";

const plans = ref<ApiPlan[]>([]);
const form = ref({
  title: "",
  goal: "",
  milestoneTitle: "",
  milestoneDescription: ""
});

async function loadPlans() {
  await ensureDemoLogin();
  plans.value = await fetchPlans();
}

async function handleCreatePlan() {
  if (!form.value.title || !form.value.milestoneTitle) {
    uni.showToast({ title: "请填写计划和阶段名称", icon: "none" });
    return;
  }

  await createPlan({
    title: form.value.title,
    goal: form.value.goal,
    cover_color: "green",
    tags: ["AI"],
    milestones: [
      {
        title: form.value.milestoneTitle,
        description: form.value.milestoneDescription,
        sort_order: 1
      }
    ]
  });

  form.value.title = "";
  form.value.goal = "";
  form.value.milestoneTitle = "";
  form.value.milestoneDescription = "";
  await loadPlans();
  uni.showToast({ title: "计划已创建", icon: "none" });
}

function goHome() {
  uni.switchTab({
    url: "/pages/home/index"
  });
}

function openPlan(planId: string) {
  uni.navigateTo({
    url: `/pages/plans/detail?id=${planId}`
  });
}

onMounted(() => {
  loadPlans().catch(() => {
    uni.showToast({ title: "加载计划失败", icon: "none" });
  });
});
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">关卡地图</text>
      <text class="title">行动路线</text>
      <text class="copy">把 AI 给你的路线变成一张可挑战的地图，每个阶段都是下一道关。</text>
      <view class="hero-actions">
        <button class="ghost-button hero-button-secondary" @click="goHome">回冒险面板</button>
        <button class="primary-button hero-button" @click="handleCreatePlan">解锁路线</button>
      </view>
    </view>

    <view class="card">
      <text class="section-title">已解锁路线</text>
      <view v-if="plans.length">
        <view v-for="plan in plans" :key="plan.id || plan._id" class="plan-row" @click="openPlan(String(plan.id || plan._id))">
          <view class="route-badge">主线</view>
          <text class="plan-title">{{ plan.title }}</text>
          <text class="plan-meta">{{ plan.goal || "还没有目标描述" }}</text>
          <view class="route-progress">
            <view class="route-progress-fill" :style="{ width: `${Math.round(Number(plan.progress || 0) * 100)}%` }" />
          </view>
        </view>
      </view>
      <text v-else class="copy">地图还是空的。先解锁一条路线，再放进第一个关卡。</text>
    </view>

    <view class="card">
      <text class="section-title">解锁新路线</text>
      <text class="copy">写下目标和第一道关卡，首页就能开始给你派发任务。</text>
      <input v-model="form.title" class="input" placeholder="计划名称" />
      <textarea v-model="form.goal" class="textarea" auto-height placeholder="最终目标" />
      <input v-model="form.milestoneTitle" class="input" placeholder="第一阶段名称" />
      <textarea v-model="form.milestoneDescription" class="textarea" auto-height placeholder="第一阶段描述" />
      <button class="primary-button" @click="handleCreatePlan">解锁路线</button>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40rpx 28rpx 132rpx;
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
    radial-gradient(circle at 86% 12%, rgba(255, 223, 105, 0.34), transparent 28%),
    linear-gradient(135deg, #f4fff8, #fff9df);
  color: #111827;
  border: 1rpx solid rgba(89, 201, 140, 0.18);
}

.hero {
  padding: 30rpx;
}

.card {
  padding: 26rpx;
  margin-top: 24rpx;
}

.eyebrow,
.copy,
.plan-meta {
  color: #8b95a5;
}

.hero .eyebrow,
.hero .copy {
  color: #7f8998;
}

.title,
.section-title,
.plan-title {
  display: block;
}

.title {
  margin-top: 10rpx;
  color: #111827;
  font-size: 42rpx;
  font-weight: 900;
  letter-spacing: -0.8rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #111827;
}

.copy,
.plan-meta {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.input,
.textarea {
  width: 100%;
  margin-top: 14rpx;
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

.primary-button {
  margin-top: 20rpx;
  border: none;
  border-radius: 28rpx;
  min-height: 82rpx;
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  font-weight: 900;
  box-shadow: 0 14rpx 26rpx rgba(22, 170, 104, 0.2);
}

.ghost-button {
  border: none;
  border-radius: 28rpx;
  min-height: 82rpx;
  background: linear-gradient(135deg, #fff8df, #f9e6b7);
  color: #765327;
  font-weight: 900;
  box-shadow:
    0 12rpx 24rpx rgba(166, 124, 40, 0.12),
    inset 0 0 0 1rpx rgba(180, 130, 35, 0.08);
}

.hero-button {
  margin-top: 0;
  flex: 1;
}

.hero-button-secondary {
  margin-top: 0;
  flex: 0.9;
}

.plan-row {
  position: relative;
  margin-top: 14rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #f8fff9, #fffdf4);
  border: 1rpx solid rgba(22, 167, 107, 0.08);
}

.route-badge {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #e8f8ef;
  color: #16a76b;
  font-weight: 900;
}

.plan-title {
  color: #111827;
  font-weight: 900;
}

.route-badge {
  font-size: 20rpx;
}

.route-progress {
  height: 12rpx;
  margin-top: 16rpx;
  border-radius: 999rpx;
  background: rgba(22, 167, 107, 0.12);
  overflow: hidden;
}

.route-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #25c27a, #39d895);
}
</style>
