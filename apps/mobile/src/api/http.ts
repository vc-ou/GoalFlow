const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

type HttpMethod = "OPTIONS" | "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
type HttpOptions = Omit<UniNamespace.RequestOptions, "url" | "method"> & {
  method?: HttpMethod;
};

export async function http<T>(path: string, options: HttpOptions = {}) {
  try {
    return await requestOnce<T>(path, options);
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode !== 401 || path === "/login") {
      throw error;
    }

    uni.removeStorageSync("token");
    uni.removeStorageSync("user_id");
    const { ensureDemoLogin } = await import("./auth");
    await ensureDemoLogin();
    return requestOnce<T>(path, options);
  }
}

async function requestOnce<T>(path: string, options: HttpOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    const token = uni.getStorageSync("token");

    uni.request({
      url: `${BASE_URL}${path}`,
      method: (options.method ?? "GET") as UniNamespace.RequestOptions["method"],
      data: options.data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as T);
          return;
        }

        reject({
          ...(typeof response.data === "object" && response.data ? response.data : {}),
          statusCode: response.statusCode
        });
      },
      fail: reject
    });
  });
}
