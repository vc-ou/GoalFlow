import mongoose, { Schema } from "mongoose";

export interface MilestoneDocument {
  plan_id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const milestoneSchema = new Schema<MilestoneDocument>(
  {
    plan_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    sort_order: { type: Number, default: 1 },
    deleted_at: { type: Date, default: null }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const MilestoneModel =
  mongoose.models.Milestone || mongoose.model<MilestoneDocument>("Milestone", milestoneSchema);
