<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { loginWithWechat, logoutAuth } from "../../api/auth";
import { fetchProfile, type ProfilePayload } from "../../api/profile";

const profile = ref<ProfilePayload | null>(null);
const loading = ref(false);
const isLoggedIn = ref(Boolean(uni.getStorageSync("token")));

const nickname = computed(() => profile.value?.user.nickname || "GoalFlow 玩家");
const avatarText = computed(() => nickname.value.slice(0, 1).toUpperCase());

async function loadProfile() {
  if (!uni.getStorageSync("token")) {
    isLoggedIn.value = false;
    profile.value = null;
    return;
  }

  loading.value = true;
  try {
    profile.value = await fetchProfile();
    isLoggedIn.value = true;
  } finally {
    loading.value = false;
  }
}

async function handleWechatLogin() {
  loading.value = true;
  try {
    await loginWithWechat();
    isLoggedIn.value = true;
    await loadProfile();
    uni.showToast({ title: "登录成功", icon: "none" });
  } catch (error) {
    const message = resolveLoginErrorMessage(error);
    uni.showToast({ title: message, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goHome() {
  uni.switchTab({ url: "/pages/home/index" });
}

function clearCache() {
  logoutAuth();
  isLoggedIn.value = false;
  profile.value = null;
  uni.showToast({ title: "缓存已清理", icon: "none" });
}

function logout() {
  logoutAuth();
  isLoggedIn.value = false;
  profile.value = null;
  uni.showToast({ title: "已退出登录", icon: "none" });
}

function resolveLoginErrorMessage(error: unknown) {
  const payload = error as { message?: string; wechat?: { errmsg?: string; errcode?: number } };
  if (payload?.wechat?.errmsg) {
    return `微信登录失败：${payload.wechat.errmsg}`;
  }
  if (payload?.message) {
    return `登录失败：${payload.message}`;
  }
  return "登录失败，请稍后重试";
}

onMounted(() => {
  loadProfile().catch(() => {
    uni.showToast({ title: "加载我的信息失败", icon: "none" });
  });
});
</script>

<template>
  <view class="page">
    <view class="hero" v-if="isLoggedIn">
      <text class="eyebrow">冒险者档案</text>
      <view class="player-row">
        <image v-if="profile?.user.avatar" class="avatar" :src="profile.user.avatar" mode="aspectFill" />
        <view v-else class="avatar avatar-fallback">
          <text>{{ avatarText }}</text>
        </view>
        <view class="player-copy">
          <text class="title">{{ nickname }}</text>
          <text class="copy">继续把 AI 给你的路线，打成真实进度。</text>
        </view>
      </view>
    </view>

    <view v-else class="hero login-hero">
      <text class="eyebrow">冒险者档案</text>
      <text class="title">登录后同步你的成长路线</text>
      <text class="copy">使用微信授权登录，恢复当前计划、任务进度和复盘存档。</text>
      <button class="primary-button login-button" :disabled="loading" @click="handleWechatLogin">
        {{ loading ? "登录中..." : "微信授权登录" }}
      </button>
    </view>

    <view v-if="isLoggedIn" class="stats-grid">
      <view class="stat-card">
        <text class="stat-value">{{ profile?.stats.active_plans_count ?? 0 }}</text>
        <text class="stat-label">当前目标</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ profile?.stats.completed_tasks_count ?? 0 }}</text>
        <text class="stat-label">完成任务</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ profile?.stats.reviews_count ?? 0 }}</text>
        <text class="stat-label">累计存档</text>
      </view>
    </view>

    <view v-if="isLoggedIn" class="card">
      <text class="section-title">设置</text>
      <text class="helper">这里先保持轻量，只放最必要的账号操作。更多偏好设置留给下一版。</text>
      <button class="primary-button" @click="goHome">回到推进面板</button>
      <button class="soft-button" @click="clearCache">清理缓存</button>
      <button class="danger-button" @click="logout">退出登录</button>
      <text v-if="loading" class="helper">正在读取档案...</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40rpx 28rpx 132rpx;
}

.hero,
.card,
.stat-card {
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.93);
  box-shadow:
    0 22rpx 56rpx rgba(31, 54, 43, 0.08),
    inset 0 0 0 1rpx rgba(31, 74, 53, 0.05);
}

.hero {
  padding: 30rpx;
  color: #111827;
  background:
    radial-gradient(circle at 86% 12%, rgba(255, 223, 105, 0.34), transparent 28%),
    linear-gradient(135deg, #f4fff8, #fff9df);
  border: 1rpx solid rgba(89, 201, 140, 0.18);
}

.login-hero {
  padding-bottom: 34rpx;
}

.login-button {
  margin-top: 28rpx;
}

.card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.eyebrow,
.copy,
.helper,
.stat-label {
  color: #8b95a5;
}

.hero .eyebrow,
.hero .copy {
  color: #7f8998;
}

.player-row {
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin-top: 18rpx;
}

.avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 34rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.88);
  box-shadow: 0 12rpx 26rpx rgba(31, 54, 43, 0.1);
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  font-size: 42rpx;
  font-weight: 800;
}

.player-copy {
  flex: 1;
}

.title,
.section-title,
.stat-value,
.stat-label {
  display: block;
}

.title {
  color: #111827;
  font-size: 42rpx;
  font-weight: 900;
  letter-spacing: -0.8rpx;
}

.copy,
.helper {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 24rpx;
}

.stat-card {
  padding: 24rpx 16rpx;
  text-align: center;
  background: linear-gradient(135deg, #f8fff9, #fffdf4);
}

.stat-value {
  color: #16a76b;
  font-size: 42rpx;
  font-weight: 800;
}

.stat-label {
  margin-top: 8rpx;
  font-size: 22rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #111827;
}

.primary-button,
.soft-button,
.danger-button {
  margin-top: 18rpx;
  min-height: 82rpx;
  border: none;
  border-radius: 28rpx;
  font-size: 27rpx;
  font-weight: 900;
}

.primary-button {
  background: linear-gradient(135deg, #2ed486, #16aa68);
  color: #fff;
  box-shadow: 0 14rpx 26rpx rgba(22, 170, 104, 0.2);
}

.soft-button {
  background: #e8f8ef;
  color: #16a76b;
}

.danger-button {
  background: #f5e5df;
  color: #9a4b2f;
}
</style>
