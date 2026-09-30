const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
  retry?: boolean;
};

let sessionRefreshPromise: Promise<boolean> | null = null;

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { retry, ...requestOptions } = options;
  const method = (requestOptions.method || "GET").toUpperCase();
  const shouldRetry = retry ?? (method === "GET" || method === "HEAD");
  const maxAttempts = shouldRetry ? 2 : 1;
  let lastError: unknown;
  let sessionRefreshAttempted = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await apiClientAttempt<T>(endpoint, requestOptions);
    } catch (error) {
      lastError = error;
      if (!sessionRefreshAttempted && shouldRefreshSession(endpoint, error)) {
        sessionRefreshAttempted = true;
        if (await refreshSession()) {
          attempt -= 1;
          continue;
        }
        redirectToLogin();
      }
      if (attempt >= maxAttempts || !shouldRetryApiError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed.");
}

function shouldRefreshSession(endpoint: string, error: unknown) {
  return error instanceof ApiClientError
    && error.status === 401
    && !endpoint.startsWith("/auth/");
}

function refreshSession() {
  if (!sessionRefreshPromise) {
    sessionRefreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        sessionRefreshPromise = null;
      });
  }
  return sessionRefreshPromise;
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.assign("/auth/login?reason=session-expired");
  }
}

async function apiClientAttempt<T = unknown>(
  endpoint: string,
  options: Omit<ApiClientOptions, "retry"> = {}
): Promise<T> {
  const { body, headers, timeoutMs = 15000, signal, ...customOptions } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromCaller = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    signal.addEventListener("abort", abortFromCaller, { once: true });
  }

  const requestHeaders = new Headers(headers);
  if (!isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...customOptions,
    headers: requestHeaders,
    // Ensures cookies are sent and received with cross-origin requests if needed
    credentials: "include",
    signal: controller.signal,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiClientError(
        timedOut ? "Request timed out. Please try again." : "Request canceled.",
        timedOut ? 408 : 499,
      );
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : "Network request failed.",
      0,
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  // Response parsing
  let data: unknown = null;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const parsedError = parseApiError(data);
    throw new ApiClientError(
      parsedError.message || defaultStatusMessage(response.status),
      response.status,
      parsedError.code,
      data,
    );
  }

  return data as T;
}

function parseApiError(data: unknown): { message?: string; code?: string } {
  if (!data || typeof data !== "object") return {};
  const payload = data as {
    detail?: string | { message?: unknown; code?: unknown };
    message?: unknown;
    error?: unknown;
  };
  if (typeof payload.detail === "string") return { message: payload.detail };
  const detailMessage = typeof payload.detail?.message === "string" ? payload.detail.message : undefined;
  const detailCode = typeof payload.detail?.code === "string" ? payload.detail.code : undefined;
  const message = detailMessage
    || (typeof payload.message === "string" ? payload.message : undefined)
    || (typeof payload.error === "string" ? payload.error : undefined);
  return { message, code: detailCode };
}

function defaultStatusMessage(status: number) {
  if (status === 400 || status === 422) return "Some submitted information is invalid.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested item could not be found.";
  if (status === 409) return "This change conflicts with existing data.";
  if (status === 429) return "Too many requests. Please wait and try again.";
  if (status >= 500) return "The service is temporarily unavailable. Please try again.";
  return `Request failed with status ${status}`;
}

function shouldRetryApiError(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  return (
    error.status === 0 ||
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500
  );
}

export async function apiClientUpload<T>(
  endpoint: string,
  body: FormData,
  options: {
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  try {
    return await apiClientUploadAttempt<T>(endpoint, body, options);
  } catch (error) {
    if (shouldRefreshSession(endpoint, error) && !options.signal?.aborted) {
      if (await refreshSession()) {
        return apiClientUploadAttempt<T>(endpoint, body, options);
      }
      redirectToLogin();
    }
    throw error;
  }
}

function apiClientUploadAttempt<T>(
  endpoint: string,
  body: FormData,
  options: {
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
    timeoutMs?: number;
  },
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE}${endpoint}`);
    request.withCredentials = true;
    request.timeout = options.timeoutMs ?? 30000;

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      let data: unknown = null;
      try {
        data = request.responseText ? JSON.parse(request.responseText) : null;
      } catch {
        data = null;
      }
      if (request.status >= 200 && request.status < 300) {
        options.onProgress?.(100);
        resolve(data as T);
        return;
      }
      const payload = data as { detail?: { message?: string; code?: string } | string; message?: string; error?: string } | null;
      const detail = typeof payload?.detail === "string" ? payload.detail : payload?.detail?.message;
      reject(new ApiClientError(
        detail || payload?.message || payload?.error || defaultStatusMessage(request.status),
        request.status,
        typeof payload?.detail === "object" ? payload.detail?.code : undefined,
        data,
      ));
    });
    request.addEventListener("error", () => reject(new ApiClientError("Network request failed.", 0)));
    request.addEventListener("timeout", () => reject(new ApiClientError("Upload timed out. Please try again.", 408)));
    request.addEventListener("abort", () => reject(new ApiClientError("Upload canceled.", 499)));

    const abort = () => request.abort();
    if (options.signal?.aborted) {
      abort();
      return;
    }
    options.signal?.addEventListener("abort", abort, { once: true });
    request.addEventListener("loadend", () => options.signal?.removeEventListener("abort", abort));
    request.send(body);
  });
}
