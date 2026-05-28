import mongoose, { Schema } from "mongoose";

export interface TemplatePlanDocument {
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
      description: string;
      execution_platforms: string[];
      search_keywords: string[];
      completion_criteria: string;
      weight: number;
      priority: "low" | "normal" | "high";
      tags: string[];
      remark: string;
      sort_order: number;
    }>;
  }>;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const templateTaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    execution_platforms: { type: [String], default: [] },
    search_keywords: { type: [String], default: [] },
    completion_criteria: { type: String, default: "" },
    weight: { type: Number, default: 10 },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    tags: { type: [String], default: [] },
    remark: { type: String, default: "" },
    sort_order: { type: Number, default: 1 }
  },
  { _id: false }
);

const templateMilestoneSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    sort_order: { type: Number, default: 1 },
    tasks: { type: [templateTaskSchema], default: [] }
  },
  { _id: false }
);

const templatePlanSchema = new Schema<TemplatePlanDocument>(
  {
    title: { type: String, required: true },
    goal: { type: String, default: "" },
    cover_color: { type: String, default: "green" },
    tags: { type: [String], default: [] },
    milestones: { type: [templateMilestoneSchema], default: [] },
    deleted_at: { type: Date, default: null }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const TemplatePlanModel =
  mongoose.models.TemplatePlan || mongoose.model<TemplatePlanDocument>("TemplatePlan", templatePlanSchema);
