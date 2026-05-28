import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { TomorrowTodoModel } from "../models/tomorrow-todo.js";
import { getLocalDateKey, getTomorrowLocalDateKey } from "../utils/local-date.js";

export const tomorrowTodosRouter = Router();

tomorrowTodosRouter.use(requireAuth);

tomorrowTodosRouter.get(
  "/tomorrow-todos",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const today = getLocalDateKey();
    await TomorrowTodoModel.deleteMany({ user_id: userId, target_date: { $lt: today } });
    const items = await TomorrowTodoModel.find({ user_id: userId, target_date: today })
      .sort({ sort_order: 1, created_at: 1 })
      .lean();
    res.json(items);
  })
);

tomorrowTodosRouter.post(
  "/tomorrow-todos",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const tomorrow = getTomorrowLocalDateKey();
    const count = await TomorrowTodoModel.countDocuments({ user_id: userId, target_date: tomorrow });
    const item = await TomorrowTodoModel.create({
      user_id: userId,
      content: req.body.content,
      target_date: tomorrow,
      sort_order: count + 1
    });
    res.status(201).json(item);
  })
);

tomorrowTodosRouter.patch(
  "/tomorrow-todos/reorder",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    await Promise.all(
      items.map((item: { id: string; sort_order: number }) =>
        TomorrowTodoModel.findOneAndUpdate(
          { _id: item.id, user_id: userId },
          { sort_order: item.sort_order }
        )
      )
    );

    res.json({ success: true });
  })
);

tomorrowTodosRouter.put(
  "/tomorrow-todos/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const item = await TomorrowTodoModel.findOne({
      _id: req.params.id,
      user_id: userId
    });

    if (!item) {
      res.status(404).json({ code: "TODO_NOT_FOUND", message: "Tomorrow todo not found" });
      return;
    }

    if (req.body.content !== undefined) {
      item.content = req.body.content;
    }

    if (req.body.status !== undefined) {
      item.status = req.body.status;
      item.completed_at = req.body.status === "done" ? new Date() : null;
    }

    if (req.body.sort_order !== undefined) {
      item.sort_order = req.body.sort_order;
    }

    await item.save();
    res.json(item);
  })
);

tomorrowTodosRouter.delete(
  "/tomorrow-todos/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const result = await TomorrowTodoModel.findOneAndDelete({
      _id: req.params.id,
      user_id: userId
    });

    if (!result) {
      res.status(404).json({ code: "TODO_NOT_FOUND", message: "Tomorrow todo not found" });
      return;
    }

    res.json({ success: true });
  })
);

tomorrowTodosRouter.patch(
  "/tomorrow-todos/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const item = await TomorrowTodoModel.findOne({
      _id: req.params.id,
      user_id: userId
    });

    if (!item) {
      res.status(404).json({ code: "TODO_NOT_FOUND", message: "Tomorrow todo not found" });
      return;
    }

    if (req.body.content !== undefined) {
      item.content = req.body.content;
    }

    if (req.body.status !== undefined) {
      item.status = req.body.status;
      item.completed_at = req.body.status === "done" ? new Date() : null;
    }

    if (req.body.sort_order !== undefined) {
      item.sort_order = req.body.sort_order;
    }

    await item.save();
    res.json(item);
  })
);
