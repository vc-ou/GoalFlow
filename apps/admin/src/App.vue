<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  adminLogin,
  clearAdminToken,
  copyTemplateToUser,
  createTemplate,
  deleteTemplate,
  fetchAdminStats,
  fetchAdminUserPlans,
  fetchAdminUsers,
  fetchTemplates,
  getAdminToken,
  updateTemplate,
  updateUserStatus,
  type AdminStats,
  type AdminUser,
  type AdminUserPlan,
  type TemplatePlan
} from "./api";

const token = ref(getAdminToken());
const username = ref("admin");
const password = ref("");
const keyword = ref("");
const loading = ref(false);
const message = ref("");
const stats = ref<AdminStats | null>(null);
const users = ref<AdminUser[]>([]);
const templates = ref<TemplatePlan[]>([]);
const selectedUserId = ref("");
const selectedUserPlans = ref<AdminUserPlan[]>([]);
const editingTemplateId = ref("");
const templateForm = ref({
  title: "",
  goal: "",
  tags: "AI",
  milestoneTitle: "",
  taskTitle: ""
});

const isLoggedIn = computed(() => Boolean(token.value));
const averageCompletion = computed(() => Math.round(Number(stats.value?.average_completion_rate ?? 0) * 100));

async function handleLogin() {
  loading.value = true;
  message.value = "";
  try {
    const response = await adminLogin(username.value.trim(), password.value);
    token.value = response.token;
    password.value = "";
    await loadDashboard();
  } catch (error) {
    message.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadDashboard() {
  if (!token.value) return;

  loading.value = true;
  message.value = "";
  try {
    const [nextStats, nextUsers, nextTemplates] = await Promise.all([
      fetchAdminStats(),
      fetchAdminUsers(keyword.value.trim()),
      fetchTemplates()
    ]);
    stats.value = nextStats;
    users.value = nextUsers;
    templates.value = nextTemplates;
  } catch (error) {
    message.value = getErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function toggleUserStatus(user: AdminUser) {
  const nextStatus = user.status === "banned" ? "active" : "banned";
  await updateUserStatus(user.id, nextStatus);
  await loadDashboard();
}

async function selectUser(user: AdminUser) {
  if (selectedUserId.value === user.id) {
    selectedUserId.value = "";
    selectedUserPlans.value = [];
    return;
  }

  selectedUserId.value = user.id;
  selectedUserPlans.value = await fetchAdminUserPlans(user.id);
}

async function saveTemplate() {
  if (!templateForm.value.title.trim()) {
    message.value = "请填写模板名称";
    return;
  }

  const payload: TemplatePlan = {
    title: templateForm.value.title.trim(),
    goal: templateForm.value.goal.trim(),
    cover_color: "green",
    tags: splitTags(templateForm.value.tags),
    milestones: templateForm.value.milestoneTitle.trim()
      ? [
          {
            title: templateForm.value.milestoneTitle.trim(),
            description: "",
            sort_order: 1,
            tasks: templateForm.value.taskTitle.trim()
              ? [{ title: templateForm.value.taskTitle.trim(), sort_order: 1 }]
              : []
          }
        ]
      : []
  };

  if (editingTemplateId.value) {
    await updateTemplate(editingTemplateId.value, payload);
  } else {
    await createTemplate(payload);
  }

  resetTemplateForm();
  await loadDashboard();
}

function editTemplate(template: TemplatePlan) {
  editingTemplateId.value = template._id || "";
  templateForm.value = {
    title: template.title,
    goal: template.goal,
    tags: template.tags.join(", "),
    milestoneTitle: template.milestones[0]?.title || "",
    taskTitle: template.milestones[0]?.tasks[0]?.title || ""
  };
}

async function removeTemplate(template: TemplatePlan) {
  if (!template._id) return;
  await deleteTemplate(template._id);
  await loadDashboard();
}

async function copyTemplate(template: TemplatePlan) {
  if (!template._id || !selectedUserId.value) {
    message.value = "请先在用户管理里选择一个用户";
    return;
  }

  await copyTemplateToUser(template._id, selectedUserId.value);
  message.value = `已复制模板「${template.title}」`;
  selectedUserPlans.value = await fetchAdminUserPlans(selectedUserId.value);
  await loadDashboard();
}

function resetTemplateForm() {
  editingTemplateId.value = "";
  templateForm.value = {
    title: "",
    goal: "",
    tags: "AI",
    milestoneTitle: "",
    taskTitle: ""
  };
}

function logout() {
  clearAdminToken();
  token.value = "";
  stats.value = null;
  users.value = [];
  templates.value = [];
}

function splitTags(value: string) {
  return value
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败";
}

onMounted(() => {
  loadDashboard();
});
</script>

<template>
  <main class="page">
    <section v-if="!isLoggedIn" class="login-shell">
      <div class="login-card">
        <p class="eyebrow">GoalFlow Admin</p>
        <h1>管理后台</h1>
        <p class="copy">管理用户、模板和增长数据。这里和小程序登录体系完全分开。</p>
        <input v-model="username" class="input" placeholder="管理员账号" />
        <input v-model="password" class="input" type="password" placeholder="管理员密码" @keyup.enter="handleLogin" />
        <button class="primary" :disabled="loading" @click="handleLogin">
          {{ loading ? "登录中..." : "登录后台" }}
        </button>
        <p v-if="message" class="message">{{ message }}</p>
      </div>
    </section>

    <template v-else>
      <header class="hero">
        <div>
          <p class="eyebrow">运营控制台</p>
          <h1>成长薄管理后台</h1>
          <p class="copy">先覆盖 V1 必要后台能力：用户封禁、模板维护、基础统计。</p>
        </div>
        <div class="hero-actions">
          <button class="ghost" :disabled="loading" @click="loadDashboard">刷新数据</button>
          <button class="danger" @click="logout">退出</button>
        </div>
      </header>

      <p v-if="message" class="message">{{ message }}</p>

      <section class="stats-grid">
        <article class="stat-card">
          <span>DAU</span>
          <strong>{{ stats?.dau ?? 0 }}</strong>
        </article>
        <article class="stat-card">
          <span>WAU</span>
          <strong>{{ stats?.wau ?? 0 }}</strong>
        </article>
        <article class="stat-card">
          <span>计划数量</span>
          <strong>{{ stats?.plans_count ?? 0 }}</strong>
        </article>
        <article class="stat-card">
          <span>平均完成率</span>
          <strong>{{ averageCompletion }}%</strong>
        </article>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">用户管理</p>
            <h2>搜索、查看和封禁用户</h2>
          </div>
          <div class="search-row">
            <input v-model="keyword" class="input compact" placeholder="昵称 / openid" @keyup.enter="loadDashboard" />
            <button class="ghost dark" @click="loadDashboard">搜索</button>
          </div>
        </div>
        <div class="table">
          <div class="table-row table-head-row">
            <span>用户</span>
            <span>状态</span>
            <span>计划</span>
            <span>活跃</span>
            <span>操作</span>
          </div>
          <template v-for="user in users" :key="user.id">
            <div class="table-row">
              <span>
                <strong>{{ user.nickname || "未命名用户" }}</strong>
                <small>{{ user.openid }}</small>
              </span>
              <span :class="['status-pill', user.status]">{{ user.status }}</span>
              <span>{{ user.active_plans_count }} / {{ user.plans_count }}</span>
              <span>{{ formatDate(user.last_active_at) }}</span>
              <span class="row-actions">
                <button class="ghost dark" @click="selectUser(user)">
                  {{ selectedUserId === user.id ? "收起" : "查看计划" }}
                </button>
                <button :class="user.status === 'banned' ? 'ghost dark' : 'danger'" @click="toggleUserStatus(user)">
                  {{ user.status === "banned" ? "解封" : "封禁" }}
                </button>
              </span>
            </div>
            <div v-if="selectedUserId === user.id" class="user-plan-panel">
              <p class="eyebrow">用户计划</p>
              <article v-for="plan in selectedUserPlans" :key="plan.id || plan._id" class="plan-mini-card">
                <strong>{{ plan.title }}</strong>
                <span>{{ Math.round(Number(plan.progress || 0) * 100) }}% · {{ plan.status }}</span>
                <small>{{ plan.milestones.length }} 个阶段 · {{ plan.milestones.reduce((sum, item) => sum + item.tasks.length, 0) }} 个任务</small>
              </article>
              <p v-if="!selectedUserPlans.length" class="copy">这个用户还没有计划。可以从右侧模板复制一条路线给 TA。</p>
            </div>
          </template>
        </div>
      </section>

      <section class="panel two-column">
        <div>
          <p class="eyebrow">模板计划</p>
          <h2>{{ editingTemplateId ? "编辑官方模板" : "创建官方模板" }}</h2>
          <input v-model="templateForm.title" class="input" placeholder="模板名称" />
          <textarea v-model="templateForm.goal" class="textarea" placeholder="模板目标" />
          <input v-model="templateForm.tags" class="input" placeholder="标签，用逗号分隔" />
          <input v-model="templateForm.milestoneTitle" class="input" placeholder="第一阶段名称" />
          <input v-model="templateForm.taskTitle" class="input" placeholder="第一任务名称" />
          <div class="button-row">
            <button class="primary" @click="saveTemplate">{{ editingTemplateId ? "更新模板" : "创建模板" }}</button>
            <button v-if="editingTemplateId" class="ghost dark" @click="resetTemplateForm">取消</button>
          </div>
        </div>

        <div>
          <p class="eyebrow">模板列表</p>
          <div v-if="templates.length" class="template-list">
            <article v-for="template in templates" :key="template._id" class="template-card">
              <strong>{{ template.title }}</strong>
              <p>{{ template.goal || "暂无目标描述" }}</p>
              <small>{{ template.milestones.length }} 个阶段 · {{ template.tags.join(", ") || "无标签" }}</small>
              <div class="button-row">
                <button class="ghost dark" @click="editTemplate(template)">编辑</button>
                <button class="ghost dark" @click="copyTemplate(template)">复制给选中用户</button>
                <button class="danger" @click="removeTemplate(template)">删除</button>
              </div>
            </article>
          </div>
          <p v-else class="copy">还没有官方模板。</p>
        </div>
      </section>

      <p class="footnote">{{ stats?.retention.note }}</p>
    </template>
  </main>
</template>
