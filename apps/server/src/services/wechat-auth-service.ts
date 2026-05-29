import { env } from "../config/env.js";

interface WechatSessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

interface WechatAuthDiagnostics {
  code?: string;
  hostname?: string;
  port?: string | number;
  syscall?: string;
  causeMessage?: string;
}

export class WechatAuthError extends Error {
  readonly code = "WECHAT_AUTH_FAILED";

  constructor(
    message: string,
    readonly payload?: WechatSessionResponse,
    readonly diagnostics?: WechatAuthDiagnostics
  ) {
    super(message);
    this.name = "WechatAuthError";
  }
}

export async function resolveWechatOpenId(code: string) {
  if (process.env.VITEST === "true" || !env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET) {
    return {
      openid: `dev_${code}`,
      mode: "dev-fallback" as const
    };
  }

  const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
  url.searchParams.set("appid", env.WECHAT_APP_ID);
  url.searchParams.set("secret", env.WECHAT_APP_SECRET);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url, {
    method: "GET"
  }).catch((error: unknown) => {
    throw new WechatAuthError("WECHAT_AUTH_REQUEST_FAILED", undefined, getFetchDiagnostics(error));
  });

  const payload = (await response.json()) as WechatSessionResponse;

  if (!response.ok) {
    throw new WechatAuthError("WECHAT_AUTH_REQUEST_FAILED", payload);
  }

  if (!payload.openid) {
    throw new WechatAuthError(payload.errmsg || "WECHAT_AUTH_INVALID_RESPONSE", payload);
  }

  return {
    openid: payload.openid,
    mode: "wechat" as const
  };
}

function getFetchDiagnostics(error: unknown): WechatAuthDiagnostics {
  const fetchError = error as {
    cause?: {
      code?: string;
      hostname?: string;
      port?: string | number;
      syscall?: string;
      message?: string;
    };
  };

  return {
    code: fetchError.cause?.code,
    hostname: fetchError.cause?.hostname,
    port: fetchError.cause?.port,
    syscall: fetchError.cause?.syscall,
    causeMessage: fetchError.cause?.message
  };
}
