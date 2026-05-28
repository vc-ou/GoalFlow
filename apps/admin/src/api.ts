const BASE_URL = "http://localhost:3000/api";
const TOKEN_KEY = "goalflow_admin_token";

export interface AdminUser {
  id: string;
  openid: string;
  nickname: string;
  avatar: string;
  current_plan_id: string | null;
  status: "active" | "banned";
  plans_count: number;
  active_plans_count: number;
  last_active_at: string;
  created_at: string;
}

export interface AdminUserPlan {
  id: string;
  _id?: string;
  title: string;
  goal: string;
  progress: number;
  status: string;
  milestones: Array<{
    id: string;
    title: string;
    tasks: Array<{
      _id?: string;
      id?: string;
      title: string;
      status: string;
      priority: string;
    }>;
  }>;
}

export interface AdminStats {
  dau: number;
  wau: number;
  plans_count: number;
  average_completion_rate: number;
  templates_count: number;
  reviews_count: number;
  retention: {
    d1: number | null;
    d7: number | null;
    note: string;
  };
}

export interface TemplatePlan {
  _id?: string;
  title: string;
  goal: string;
  cover_color: string;
  tags: string[];
  milestones: Array<{
    title: string;
    description: string;
    sort_order: number;
    tasks: Array<{
      title: string;
      description?: string;
      sort_order?: number;
    }>;
  }>;
}

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminLogin(username: string, password: string) {
  const response = await request<{ token: string; admin: { username: string } }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    skipAuth: true
  });
  setAdminToken(response.token);
  return response;
}

export function fetchAdminStats() {
  return request<AdminStats>("/admin/stats");
}

export function fetchAdminUsers(keyword = "") {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  return request<AdminUser[]>(`/admin/users${query}`);
}

export function updateUserStatus(userId: string, status: "active" | "banned") {
  return request<Pick<AdminUser, "id" | "nickname" | "status">>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function fetchAdminUserPlans(userId: string) {
  return request<AdminUserPlan[]>(`/admin/users/${userId}/plans`);
}

export function fetchTemplates() {
  return request<TemplatePlan[]>("/admin/templates");
}

export function createTemplate(payload: TemplatePlan) {
  return request<TemplatePlan>("/admin/templates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTemplate(templateId: string, payload: TemplatePlan) {
  return request<TemplatePlan>(`/admin/templates/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteTemplate(templateId: string) {
  return request<{ success: boolean }>(`/admin/templates/${templateId}`, {
    method: "DELETE"
  });
}

export function copyTemplateToUser(templateId: string, userId: string) {
  return request<{ id: string; title: string; user_id: string }>(`/admin/templates/${templateId}/copy-to-user`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId })
  });
}

async function request<T>(path: string, init: RequestInit & { skipAuth?: boolean } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string> | undefined) ?? {})
  };

  if (!init.skipAuth) {
    const token = getAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "请求失败" }));
    throw new Error(error.message || "请求失败");
  }

  return (await response.json()) as T;
}
