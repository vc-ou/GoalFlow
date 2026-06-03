import { http } from "./http";

export async function ensureDemoLogin() {
  const token = uni.getStorageSync("token");
  if (token) {
    return token as string;
  }

  return loginWithWechat();
}

export async function loginWithWechat() {
  const code = await resolveLoginCode();
  const response = await http<{ token: string; user: { id: string; nickname?: string; avatar?: string } }>("/login", {
    method: "POST",
    data: {
      code
    }
  });

  uni.setStorageSync("token", response.token);
  uni.setStorageSync("user_id", response.user.id);
  uni.setStorageSync("user_nickname", response.user.nickname || "微信用户");
  uni.setStorageSync("user_avatar", response.user.avatar || "");
  return response.token;
}

export function logoutAuth() {
  uni.removeStorageSync("token");
  uni.removeStorageSync("user_id");
  uni.removeStorageSync("user_nickname");
  uni.removeStorageSync("user_avatar");
  uni.removeStorageSync("current_plan_id");
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
