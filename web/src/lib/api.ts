import { useUserStore } from "@/stores/user";

interface ApiOptions {
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown> | BodyInit | null;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    message?: string;
  };
}

const BASE_URL = "";

async function request<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...options.headers,
  };

  const accessToken = useUserStore.getState().accessToken;
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    method: options.method,
    headers,
    body:
      options.body && typeof options.body === "object" && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body ?? undefined,
    ...(options.query
      ? { url: `${url}?${new URLSearchParams(options.query as Record<string, string>).toString()}` }
      : {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  const result: ApiResponse<T> = await response.json();

  if (result && result.ok) {
    return result.data as T;
  }

  throw new Error(result?.error?.message || "API request failed");
}

export const api = {
  get: <T>(url: string, options?: Omit<ApiOptions, "method" | "body">) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(
    url: string,
    body?: Record<string, unknown> | BodyInit | null,
    options?: Omit<ApiOptions, "method">
  ) => request<T>(url, { ...options, method: "POST", body }),

  put: <T>(
    url: string,
    body?: Record<string, unknown> | BodyInit | null,
    options?: Omit<ApiOptions, "method">
  ) => request<T>(url, { ...options, method: "PUT", body }),

  patch: <T>(
    url: string,
    body?: Record<string, unknown> | BodyInit | null,
    options?: Omit<ApiOptions, "method">
  ) => request<T>(url, { ...options, method: "PATCH", body }),

  delete: <T>(url: string, options?: Omit<ApiOptions, "method" | "body">) =>
    request<T>(url, { ...options, method: "DELETE" }),
};
