import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/user.js";
import { asyncHandler } from "../utils/async-handler.js";
import { resolveWechatOpenId } from "../services/wechat-auth-service.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { code, nickname = "新用户", avatar = "" } = req.body as {
      code?: string;
      nickname?: string;
      avatar?: string;
    };

    if (!code) {
      res.status(400).json({ code: "INVALID_INPUT", message: "code is required" });
      return;
    }

    const session = await resolveWechatOpenId(code).catch((error: unknown) => {
      const authError = error as { code?: string; message?: string; payload?: unknown };
      if (authError?.code === "WECHAT_AUTH_FAILED") {
        res.status(401).json({
          code: "WECHAT_AUTH_FAILED",
          message: authError.message || "WECHAT_AUTH_FAILED",
          wechat: authError.payload
        });
        return null;
      }
      throw error;
    });

    if (!session) {
      return;
    }

    const { openid } = session;
    let user = await UserModel.findOne({ openid });

    if (!user) {
      user = await UserModel.create({
        openid,
        nickname,
        avatar
      });
    } else {
      user.nickname = nickname || user.nickname;
      user.avatar = avatar ?? user.avatar;
      await user.save();
    }

    const token = jwt.sign({ userId: String(user._id) }, env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: String(user._id),
        nickname: user.nickname,
        avatar: user.avatar,
        current_plan_id: user.current_plan_id,
        status: user.status
      }
    });
  })
);
