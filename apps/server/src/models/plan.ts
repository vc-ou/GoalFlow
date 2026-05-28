import mongoose, { Schema } from "mongoose";
import { planStatuses, type PlanStatus } from "@goalflow/shared";

export interface PlanDocument {
  user_id: string;
  title: string;
  goal: string;
  cover_color: string;
  tags: string[];
  progress: number;
  status: PlanStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const planSchema = new Schema<PlanDocument>(
  {
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    goal: { type: String, default: "" },
    cover_color: { type: String, default: "green" },
    tags: { type: [String], default: [] },
    progress: { type: Number, default: 0 },
    status: { type: String, enum: planStatuses, default: "active" },
    deleted_at: { type: Date, default: null }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const PlanModel = mongoose.models.Plan || mongoose.model<PlanDocument>("Plan", planSchema);
