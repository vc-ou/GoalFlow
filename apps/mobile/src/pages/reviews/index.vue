<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ensureDemoLogin } from "../../api/auth";
import { createReview, deleteReview, fetchReviews, updateReview } from "../../api/reviews";
import { fetchPlans } from "../../api/plans";
import type { ApiPlan, ApiReview } from "../../api/types";

const reviews = ref<ApiReview[]>([]);
const plans = ref<ApiPlan[]>([]);
const loading = ref(false);
const deletingReviewId = ref("");
const editingReviewId = ref("");
const form = ref({
  plan_id: "",
  gains: "",
  problems: "",
  ideas: "",
  next_actions: ""
});

const selectedPlanLabel = computed(() => {
  const matched = plans.value.find((item) => String(item.id || item._id) === form.value.plan_id);
  return matched?.title ?? "不关联计划";
});

async function loadPage() {
  loading.value = true;
  try {
    await ensureDemoLogin();
    const [planItems, reviewItems] = await Promise.all([fetchPlans(), fetchReviews()]);
    plans.value = planItems;
    reviews.value = reviewItems;
  } finally {
    loading.value = false;
  }
}

function goPlans() {
  uni.switchTab({
    url: "/pages/plans/index"
  });
}

function cyclePlan() {
  const ids = ["", ...plans.value.map((item) => String(item.id || item._id))];
  const currentIndex = ids.indexOf(form.value.plan_id);
  form.value.plan_id = ids[(currentIndex + 1) % ids.length] ?? "";
}

async function submitReview() {
  if (!form.value.gains.trim() && !form.value.problems.trim() && !form.value.ideas.trim() && !form.value.next_actions.trim()) {
    uni.showToast({ title: "至少写下一点复盘内容", icon: "none" });
    return;
  }

  const payload = {
    plan_id: form.value.plan_id || null,
    gains: form.value.gains.trim(),
    problems: form.value.problems.trim(),
    ideas: form.value.ideas.trim(),
    next_actions: form.value.next_actions.trim()
  };

  const wasEditing = Boolean(editingReviewId.value);

  if (editingReviewId.value) {
    await updateReview(editingReviewId.value, payload);
  } else {
    await createReview(payload);
  }

  editingReviewId.value = "";
  form.value = {
    plan_id: "",
    gains: "",
    problems: "",
    ideas: "",
    next_actions: ""
  };
  await loadPage();
  uni.showToast({ title: wasEditing ? "存档已更新" : "存档已保存", icon: "none" });
}

function editReview(review: ApiReview) {
  editingReviewId.value = String(review.id || review._id || "");
  form.value = {
    plan_id: review.plan_id ?? "",
    gains: review.gains,
    problems: review.problems,
    ideas: review.ideas,
    next_actions: review.next_actions
  };
}

function cancelEdit() {
  editingReviewId.value = "";
  form.value = {
    plan_id: "",
    gains: "",
    problems: "",
    ideas: "",
    next_actions: ""
  };
}

async function removeReview(review: ApiReview) {
  const reviewId = String(review.id || review._id || "");
  if (!reviewId) return;

  deletingReviewId.value = reviewId;
  try {
    await deleteReview(reviewId);
    await loadPage();
    uni.showToast({ title: "复盘已删除", icon: "none" });
  } finally {
    deletingReviewId.value = "";
  }
}

function formatDate(value?: string) {
  if (!value) return "刚刚";
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

onMounted(() => {
  loadPage().catch(() => {
    uni.showToast({ title: "加载复盘失败", icon: "none" });
  });
});
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">营地存档</text>
      <text class="title">保存今天的战斗记录</text>
      <text class="copy">把收获、卡点和下一步存下来，明天回来就能继续挑战。</text>
      <view class="hero-actions">
        <button class="ghost-button hero-map-button" @click="goPlans">回关卡地图</button>
      </view>
    </view>

    <view class="card">
      <text class="section-title">{{ editingReviewId ? "编辑存档" : "新建存档" }}</text>
      <text class="helper-copy">哪怕只写一句“下一步该做什么”，这个存档就能帮你明天接上状态。</text>
      <button class="plan-switch" @click="cyclePlan">关联计划：{{ selectedPlanLabel }}</button>
      <textarea v-model="form.gains" class="textarea" auto-height placeholder="今天有什么收获？" />
      <textarea v-model="form.problems" class="textarea" auto-height placeholder="卡在哪里？" />
      <textarea v-model="form.ideas" class="textarea" auto-height placeholder="冒出了什么新想法？" />
      <textarea v-model="form.next_actions" class="textarea" auto-height placeholder="下一步最值得推进什么？" />
      <view class="review-actions">
        <button class="primary-button review-action-button" @click="submitReview">
          {{ editingReviewId ? "更新存档" : "保存存档" }}
        </button>
        <button v-if="editingReviewId" class="ghost-button review-action-button" @click="cancelEdit">取消编辑</button>
      </view>
    </view>

    <view class="card">
      <text class="section-title">最近存档</text>
      <view v-if="reviews.length">
        <view v-for="review in reviews" :key="review.id || review._id" class="review-row">
          <text class="review-time">{{ formatDate(review.created_at) }}</text>
          <text v-if="review.gains" class="review-line">收获：{{ review.gains }}</text>
          <text v-if="review.problems" class="review-line">问题：{{ review.problems }}</text>
          <text v-if="review.ideas" class="review-line">想法：{{ review.ideas }}</text>
          <text v-if="review.next_actions" class="review-line">下一步：{{ review.next_actions }}</text>
          <button class="edit-button" @click="editReview(review)">编辑</button>
          <button class="delete-button" :disabled="deletingReviewId === String(review.id || review._id)" @click="removeReview(review)">删除</button>
        </view>
      </view>
      <text v-else-if="!loading" class="empty">还没有存档。先记下一句“明天先做什么”，这页就开始有价值了。</text>
      <text v-if="loading" class="empty">加载中...</text>
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
  padding: 30rpx;
  background:
    radial-gradient(circle at 86% 12%, rgba(255, 223, 105, 0.34), transparent 28%),
    linear-gradient(135deg, #fffaf0, #f4fff8);
  color: #111827;
  border: 1rpx solid rgba(240, 160, 26, 0.14);
}

.card {
  padding: 26rpx;
  margin-top: 24rpx;
}

.eyebrow,
.copy,
.helper-copy,
.review-time,
.empty {
  color: #8b95a5;
}

.hero .eyebrow,
.hero .copy {
  color: #7f8998;
}

.title,
.section-title,
.review-line {
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

.copy,
.helper-copy,
.review-time,
.review-line,
.empty {
  margin-top: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16rpx;
  margin-top: 24rpx;
}

.plan-switch,
.primary-button,
.ghost-button,
.delete-button {
  border: none;
  border-radius: 28rpx;
  font-weight: 900;
}

.plan-switch {
  margin-top: 16rpx;
  background: #edf2ec;
  color: #16a76b;
  min-height: 72rpx;
}

.primary-button {
  margin-top: 20rpx;
  min-height: 82rpx;
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  box-shadow: 0 14rpx 26rpx rgba(22, 170, 104, 0.2);
}

.review-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 20rpx;
}

.review-action-button {
  flex: 1;
  margin-top: 0;
}

.ghost-button {
  min-height: 78rpx;
  padding: 0 28rpx;
  background: linear-gradient(135deg, #fff8df, #f9e6b7);
  color: #765327;
  box-shadow:
    0 12rpx 24rpx rgba(166, 124, 40, 0.12),
    inset 0 0 0 1rpx rgba(180, 130, 35, 0.08);
}

.hero-map-button {
  flex: 0 0 auto;
  min-width: 230rpx;
  min-height: 70rpx;
  border-radius: 999rpx;
  font-size: 27rpx;
  letter-spacing: 0.4rpx;
  box-shadow:
    0 14rpx 26rpx rgba(166, 124, 40, 0.14),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.8),
    inset 0 0 0 1rpx rgba(180, 130, 35, 0.1);
}

.edit-button,
.delete-button {
  margin-top: 16rpx;
  border: none;
  border-radius: 999rpx;
}

.edit-button {
  margin-right: 12rpx;
  background: #e8f8ef;
  color: #16a76b;
}

.delete-button {
  background: #f4e5df;
  color: #9a4b2f;
}

.textarea {
  width: 100%;
  min-height: 60rpx;
  margin-top: 14rpx;
  padding: 12rpx 22rpx;
  border-radius: 22rpx;
  background: #f8faf8;
  font-size: 27rpx;
  box-shadow: inset 0 0 0 1rpx rgba(31, 74, 53, 0.05);
  line-height: 1.38;
}

.review-row {
  margin-top: 14rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #fffaf0, #f8fff9);
  border: 1rpx solid rgba(240, 160, 26, 0.1);
}
</style>
