export const planStatuses = ["active", "archived", "completed"] as const;
export const taskStatuses = ["todo", "doing", "done"] as const;
export const taskPriorities = ["low", "normal", "high"] as const;
export const userStatuses = ["active", "banned"] as const;
export const tomorrowTodoStatuses = ["todo", "done"] as const;

export type PlanStatus = (typeof planStatuses)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type UserStatus = (typeof userStatuses)[number];
export type TomorrowTodoStatus = (typeof tomorrowTodoStatuses)[number];

export interface HomeProgressCard {
  plan_id: string;
  plan_title: string;
  milestone_id: string;
  milestone_title: string;
  plan_progress: number;
  milestone_progress: number;
}

export interface NextActionCard {
  id: string;
  title: string;
  description: string;
  execution_platforms: string[];
  search_keywords: string[];
  completion_criteria: string;
  status: TaskStatus;
  priority: TaskPriority;
  weight: number;
}
