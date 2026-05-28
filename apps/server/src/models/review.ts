import mongoose, { Schema } from "mongoose";

export interface ReviewDocument {
  user_id: string;
  plan_id: string | null;
  gains: string;
  problems: string;
  ideas: string;
  next_actions: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    user_id: { type: String, required: true, index: true },
    plan_id: { type: String, default: null },
    gains: { type: String, default: "" },
    problems: { type: String, default: "" },
    ideas: { type: String, default: "" },
    next_actions: { type: String, default: "" },
    deleted_at: { type: Date, default: null }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const ReviewModel = mongoose.models.Review || mongoose.model<ReviewDocument>("Review", reviewSchema);
