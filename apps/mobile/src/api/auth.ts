import { http } from "./http";

interface WechatProfile {
  nickname: string;
  avatar: string;
}

export async function ensureDemoLogin() {
  const token = uni.getStorageSync("token");
  if (token) {
    return token as string;
  }

  return loginWithWechat();
}

export async function loginWithWechat() {
  const profile = await resolveWechatProfile();
  const code = await resolveLoginCode();
  const response = await http<{ token: string; user: { id: string; nickname?: string; avatar?: string } }>("/login", {
    method: "POST",
    data: {
      code,
      nickname: profile.nickname,
      avatar: profile.avatar
    }
  });

  uni.setStorageSync("token", response.token);
  uni.setStorageSync("user_id", response.user.id);
  uni.setStorageSync("user_nickname", response.user.nickname || profile.nickname);
  uni.setStorageSync("user_avatar", response.user.avatar || profile.avatar);
  return response.token;
}

export function logoutAuth() {
  uni.removeStorageSync("token");
  uni.removeStorageSync("user_id");
  uni.removeStorageSync("user_nickname");
  uni.removeStorageSync("user_avatar");
  uni.removeStorageSync("current_plan_id");
}

async function resolveWechatProfile(): Promise<WechatProfile> {
  if (typeof uni.getUserProfile === "function") {
    try {
      const result = await new Promise<UniApp.GetUserProfileRes>((resolve, reject) => {
        uni.getUserProfile({
          desc: "用于展示头像和昵称，恢复你的成长档案",
          success: resolve,
          fail: reject
        });
      });

      return {
        nickname: result.userInfo?.nickName || "微信用户",
        avatar: result.userInfo?.avatarUrl || ""
      };
    } catch {
      return {
        nickname: "GoalFlow Demo",
        avatar: ""
      };
    }
  }

  return {
    nickname: "GoalFlow Demo",
    avatar: ""
  };
}

async function resolveLoginCode() {
  if (typeof uni.login === "function") {
    try {
      const result = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: "weixin",
          success: resolve,
          fail: reject
        });
      });

      if (result.code) {
        return result.code;
      }
    } catch {
      return "demo";
    }
  }

  return "demo";
}
