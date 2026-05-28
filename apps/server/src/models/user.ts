import mongoose, { Schema } from "mongoose";
import { userStatuses, type UserStatus } from "@goalflow/shared";

export interface UserDocument {
  openid: string;
  nickname: string;
  avatar: string;
  current_plan_id: string | null;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    openid: { type: String, required: true, unique: true, index: true },
    nickname: { type: String, default: "" },
    avatar: { type: String, default: "" },
    current_plan_id: { type: String, default: null },
    status: { type: String, enum: userStatuses, default: "active" }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
