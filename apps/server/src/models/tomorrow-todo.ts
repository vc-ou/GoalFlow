import mongoose, { Schema } from "mongoose";
import { tomorrowTodoStatuses, type TomorrowTodoStatus } from "@goalflow/shared";

export interface TomorrowTodoDocument {
  user_id: string;
  content: string;
  status: TomorrowTodoStatus;
  target_date: string;
  sort_order: number;
  completed_at: Date | null;
  created_at: Date;
}

const tomorrowTodoSchema = new Schema<TomorrowTodoDocument>(
  {
    user_id: { type: String, required: true, index: true },
    content: { type: String, required: true },
    status: { type: String, enum: tomorrowTodoStatuses, default: "todo" },
    target_date: { type: String, required: true, index: true },
    sort_order: { type: Number, default: 1 },
    completed_at: { type: Date, default: null }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false
    }
  }
);

export const TomorrowTodoModel =
  mongoose.models.TomorrowTodo || mongoose.model<TomorrowTodoDocument>("TomorrowTodo", tomorrowTodoSchema);
