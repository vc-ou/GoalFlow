import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ReviewModel } from "../models/review.js";

export const reviewsRouter = Router();

reviewsRouter.use(requireAuth);

reviewsRouter.get(
  "/reviews",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const items = await ReviewModel.find({ user_id: userId, deleted_at: null }).sort({ created_at: -1 }).lean();
    res.json(items);
  })
);

reviewsRouter.post(
  "/reviews",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const review = await ReviewModel.create({
      user_id: userId,
      plan_id: req.body.plan_id ?? null,
      gains: req.body.gains ?? "",
      problems: req.body.problems ?? "",
      ideas: req.body.ideas ?? "",
      next_actions: req.body.next_actions ?? ""
    });

    res.status(201).json(review);
  })
);

reviewsRouter.put(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const review = await ReviewModel.findOneAndUpdate(
      { _id: req.params.id, user_id: userId, deleted_at: null },
      {
        plan_id: req.body.plan_id ?? null,
        gains: req.body.gains ?? "",
        problems: req.body.problems ?? "",
        ideas: req.body.ideas ?? "",
        next_actions: req.body.next_actions ?? ""
      },
      { new: true }
    );

    if (!review) {
      res.status(404).json({ code: "REVIEW_NOT_FOUND", message: "Review not found" });
      return;
    }

    res.json(review);
  })
);

reviewsRouter.delete(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const review = await ReviewModel.findOneAndUpdate(
      { _id: req.params.id, user_id: userId, deleted_at: null },
      { deleted_at: new Date() },
      { new: true }
    );

    if (!review) {
      res.status(404).json({ code: "REVIEW_NOT_FOUND", message: "Review not found" });
      return;
    }

    res.json({ success: true });
  })
);
