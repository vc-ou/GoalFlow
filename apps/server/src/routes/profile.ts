import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { PlanModel } from "../models/plan.js";
import type { PlanDocument } from "../models/plan.js";
import { ReviewModel } from "../models/review.js";
import { TaskModel } from "../models/task.js";
import { UserModel } from "../models/user.js";
import type { UserDocument } from "../models/user.js";

export const profileRouter = Router();

type LeanEntity<T> = T & { _id: unknown };

profileRouter.use(requireAuth);

profileRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const user = await UserModel.findById(userId).lean<LeanEntity<UserDocument> | null>();

    if (!user) {
      res.status(404).json({ code: "USER_NOT_FOUND", message: "User not found" });
      return;
    }

    const userPlans = await PlanModel.find({ user_id: userId, deleted_at: null }).select("_id").lean<
      LeanEntity<PlanDocument>[]
    >();
    const userPlanIds = userPlans.map((plan) => String(plan._id));

    const [activePlansCount, completedTasksCount, reviewsCount] = await Promise.all([
      PlanModel.countDocuments({ user_id: userId, status: "active", deleted_at: null }),
      TaskModel.countDocuments({ plan_id: { $in: userPlanIds }, status: "done", deleted_at: null }),
      ReviewModel.countDocuments({ user_id: userId, deleted_at: null })
    ]);

    res.json({
      user: {
        id: String(user._id),
        nickname: user.nickname,
        avatar: user.avatar,
        current_plan_id: user.current_plan_id,
        status: user.status
      },
      stats: {
        active_plans_count: activePlansCount,
        completed_tasks_count: completedTasksCount,
        reviews_count: reviewsCount
      }
    });
  })
);
