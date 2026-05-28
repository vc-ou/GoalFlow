import { http } from "./http";
import { ensureDemoLogin } from "./auth";
import type { ApiPlan } from "./types";

export function fetchPlans() {
  return http<ApiPlan[]>("/plans");
}

export function fetchPlanDetail(planId: string) {
  return http<ApiPlan>(`/plans/${planId}`);
}

export function createPlan(payload: {
  title: string;
  goal: string;
  cover_color: string;
  tags: string[];
  milestones: Array<{ title: string; description: string; sort_order: number }>;
}) {
  return http<ApiPlan>("/plans", {
    method: "POST",
    data: payload
  });
}

export function updatePlan(planId: string, payload: {
  title?: string;
  goal?: string;
  cover_color?: string;
  tags?: string[];
}) {
  return http<ApiPlan>(`/plans/${planId}`, {
    method: "PUT",
    data: payload
  });
}

export async function setCurrentPlan(planId: string) {
  await ensureDemoLogin();
  const result = await http<{ success: boolean; current_plan_id?: string; plan_id?: string }>(`/plans/${planId}/current`, {
    method: "POST",
    data: { is_current: true }
  });
  uni.setStorageSync("current_plan_id", result.current_plan_id || result.plan_id || planId);
  return result;
}

export function updatePlanStatus(planId: string, status: string) {
  return http<ApiPlan>(`/plans/${planId}/status`, {
    method: "PATCH",
    data: { status }
  });
}

export function deletePlan(planId: string) {
  return http<{ success: boolean }>(`/plans/${planId}`, {
    method: "DELETE"
  });
}
