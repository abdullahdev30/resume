import { BACKEND_API_BASE } from "@/lib/backend-api-url";
import { safeAuthDestination } from "@/modules/auth/session";

// Cookie rotation must happen in a Route Handler so the browser receives it.
export async function GET(request: Request) {
  const destination = safeAuthDestination(
    new URL(request.url).searchParams.get("next"),
  );
  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return new Response(null, {
      status: 307,
      headers: {
        location: `/auth/login?reason=service-unavailable&next=${encodeURIComponent(destination)}`,
        "cache-control": "no-store",
      },
    });
  }
  const target = upstream.ok
    ? destination
    : `/auth/login?reason=session-expired&next=${encodeURIComponent(destination)}`;
  // A relative Location preserves the browser's public host behind a proxy.
  const response = new Response(null, {
    status: 307,
    headers: { location: target },
  });
  response.headers.set("cache-control", "no-store");
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append(
      "set-cookie",
      cookie.replace(/;\s*domain=[^;]*/gi, ""),
    );
  }
  return response;
}
