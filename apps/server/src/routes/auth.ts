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
    const { code, nickname, avatar } = req.body as {
      code?: string;
      nickname?: string;
      avatar?: string;
    };

    if (!code) {
      res.status(400).json({ code: "INVALID_INPUT", message: "code is required" });
      return;
    }

    const session = await resolveWechatOpenId(code).catch((error: unknown) => {
      const authError = error as { code?: string; message?: string; payload?: unknown; diagnostics?: unknown };
      if (authError?.code === "WECHAT_AUTH_FAILED") {
        res.status(401).json({
          code: "WECHAT_AUTH_FAILED",
          message: authError.message || "WECHAT_AUTH_FAILED",
          wechat: authError.payload,
          diagnostics: authError.diagnostics
        });
        return null;
      }

      const fallbackError = error as { name?: string; message?: string };
      console.error("WeChat auth failed before session resolution", error);
      res.status(401).json({
        code: "WECHAT_AUTH_FAILED",
        message: fallbackError?.message || "WECHAT_AUTH_FAILED",
        errorName: fallbackError?.name || "Error"
      });
      return null;
    });

    if (!session) {
      return;
    }

    const { openid } = session;
    const profileUpdates: { nickname?: string; avatar?: string } = {};
    if (typeof nickname === "string" && nickname.trim()) {
      profileUpdates.nickname = nickname.trim();
    }
    if (typeof avatar === "string" && avatar.trim()) {
      profileUpdates.avatar = avatar.trim();
    }

    const user = await UserModel.findOneAndUpdate(
      { openid },
      {
        $setOnInsert: {
          openid,
          nickname: normalizeNickname(nickname),
          avatar: normalizeAvatar(avatar)
        }
      },
      { new: true, upsert: true }
    );

    if (Object.keys(profileUpdates).length) {
      user.set(profileUpdates);
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

function normalizeNickname(nickname: string | undefined) {
  const value = nickname?.trim();
  return value || "微信用户";
}

function normalizeAvatar(avatar: string | undefined) {
  return avatar?.trim() || "";
}
