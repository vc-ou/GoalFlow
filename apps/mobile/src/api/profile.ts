import { http } from "./http";

export interface ProfilePayload {
  user: {
    id: string;
    nickname: string;
    avatar: string;
    current_plan_id: string | null;
    status: string;
  };
  stats: {
    active_plans_count: number;
    completed_tasks_count: number;
    reviews_count: number;
  };
}

export function fetchProfile() {
  return http<ProfilePayload>("/profile");
}
