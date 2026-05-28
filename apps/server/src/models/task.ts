import mongoose, { Schema } from "mongoose";
import { taskPriorities, taskStatuses, type TaskPriority, type TaskStatus } from "@goalflow/shared";

export interface TaskDocument {
  plan_id: string;
  milestone_id: string;
  title: string;
  description: string;
  execution_platforms: string[];
  search_keywords: string[];
  completion_criteria: string;
  weight: number;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  remark: string;
  sort_order: number;
  status_changed_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const taskSchema = new Schema<TaskDocument>(
  {
    plan_id: { type: String, required: true, index: true },
    milestone_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    execution_platforms: { type: [String], default: [] },
    search_keywords: { type: [String], default: [] },
    completion_criteria: { type: String, default: "" },
    weight: { type: Number, default: 10 },
    status: { type: String, enum: taskStatuses, default: "todo", index: true },
    priority: { type: String, enum: taskPriorities, default: "normal", index: true },
    tags: { type: [String], default: [] },
    remark: { type: String, default: "" },
    sort_order: { type: Number, default: 1 },
    status_changed_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    deleted_at: { type: Date, default: null }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

taskSchema.index({ plan_id: 1, milestone_id: 1, status: 1, status_changed_at: 1, priority: 1, sort_order: 1, updated_at: -1 });

export const TaskModel = mongoose.models.Task || mongoose.model<TaskDocument>("Task", taskSchema);
