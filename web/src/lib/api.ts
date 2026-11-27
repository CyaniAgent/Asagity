import { useUserStore } from "@/stores/user";
import { fetchBackend } from "@/lib/backend";

interface ApiOptions {
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown> | BodyInit | null;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    message?: string;
  };
}

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

  const queryString = options.query
    ? `?${new URLSearchParams(options.query as Record<string, string>).toString()}`
    : "";
  const path = `${url}${queryString}`;

  const isJsonBody =
    typeof options.body === "string" ||
    (options.body !== null &&
      typeof options.body === "object" &&
      !(options.body instanceof FormData) &&
      !(options.body instanceof URLSearchParams) &&
      !(options.body instanceof Blob) &&
      !(options.body instanceof ArrayBuffer));
  if (isJsonBody && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
    // Minimal API returns 415 without this header — fetch defaults to text/plain.
    headers["Content-Type"] = "application/json";
  }

  let body: BodyInit | undefined;
  if (isJsonBody) {
    body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  } else if (options.body != null) {
    body = options.body as BodyInit;
  }

  const response = await fetchBackend(path, {
    method: options.method,
    headers,
    body,
    signal: options.signal,
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
