export interface ApiPlan {
  id?: string;
  _id?: string;
  title: string;
  goal: string;
  cover_color: string;
  progress: number;
  status: string;
  is_current?: boolean;
  milestones?: ApiMilestone[];
}

export interface ApiMilestone {
  id?: string;
  _id?: string;
  plan_id?: string;
  title: string;
  description: string;
  sort_order: number;
  tasks?: ApiTask[];
}

export interface ApiTask {
  id?: string;
  _id?: string;
  plan_id?: string;
  milestone_id?: string;
  title: string;
  description: string;
  execution_platforms: string[];
  search_keywords: string[];
  completion_criteria: string;
  weight: number;
  status: string;
  priority: string;
  tags: string[];
  remark: string;
  sort_order: number;
}

export interface ApiReview {
  id?: string;
  _id?: string;
  plan_id: string | null;
  gains: string;
  problems: string;
  ideas: string;
  next_actions: string;
  created_at?: string;
  updated_at?: string;
}
