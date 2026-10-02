import "server-only";

const configuredBackendApiUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export const BACKEND_API_BASE = configuredBackendApiUrl.replace(/\/$/, "");
