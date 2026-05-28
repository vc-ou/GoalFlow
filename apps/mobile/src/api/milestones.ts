import { http } from "./http";
import type { ApiMilestone } from "./types";

export function createMilestone(payload: {
  plan_id: string;
  title: string;
  description: string;
  sort_order: number;
}) {
  return http<ApiMilestone>("/milestones", {
    method: "POST",
    data: payload
  });
}

export function updateMilestone(
  milestoneId: string,
  payload: {
    title?: string;
    description?: string;
    sort_order?: number;
  }
) {
  return http<ApiMilestone>(`/milestones/${milestoneId}`, {
    method: "PUT",
    data: payload
  });
}

export function deleteMilestone(milestoneId: string) {
  return http<{ success: boolean }>(`/milestones/${milestoneId}`, {
    method: "DELETE"
  });
}
