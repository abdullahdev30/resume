const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

interface ApiClientOptions extends RequestInit {
  body?: any;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { body, headers, ...customOptions } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...customOptions,
    headers: requestHeaders,
    // Ensures cookies are sent and received with cross-origin requests if needed
    credentials: "include", 
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Response parsing
  let data: any = null;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}