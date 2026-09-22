export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8000"
).replace(/\/$/, "");
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api";
const API_BASE = `${API_ORIGIN}${API_PREFIX}`;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function toErrorMessage(status: number, data: unknown): string {
  if (status === 429) {
    return "Too many attempts. Try again in a few minutes.";
  }

  if (!data || typeof data !== "object") {
    return "Something went wrong";
  }

  const body = data as {
    message?: string;
    detail?: { message?: string } | Array<{ msg?: string }>;
  };

  return (
    body.message ||
    (!Array.isArray(body.detail) ? body.detail?.message : body.detail[0]?.msg) ||
    "Something went wrong"
  );
}

async function request<T>(
  path: string,
  options: ApiRequestOptions,
): Promise<{ data: T; status: number }> {
  const { body, headers, timeoutMs = 10_000, ...init } = options;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as T;

    if (!response.ok) {
      throw new ApiError(toErrorMessage(response.status, data), response.status);
    }

    return { data, status: response.status };
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  try {
    return (await request<T>(path, options)).data;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || path === "/auth/refresh") {
      throw error;
    }

    try {
      await request("/auth/refresh", { method: "POST" });
      return (await request<T>(path, options)).data;
    } catch {
      if (typeof window !== "undefined") {
        window.location.assign("/auth/login");
      }
      throw error;
    }
  }
}
