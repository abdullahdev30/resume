import { BACKEND_API_BASE } from "@/lib/backend-api-url";

const REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
] as const;

const RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-type",
  "etag",
  "last-modified",
  "location",
  "retry-after",
  "vary",
  "www-authenticate",
] as const;

type ApiRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function forwardToBackend(
  request: Request,
  context: ApiRouteContext,
): Promise<Response> {
  const { path } = await context.params;
  const upstreamUrl = new URL(
    `${BACKEND_API_BASE}/${path.map(encodeURIComponent).join("/")}`,
  );
  upstreamUrl.search = new URL(request.url).search;

  const requestHeaders = new Headers();
  for (const headerName of REQUEST_HEADERS) {
    const value = request.headers.get(headerName);
    if (value) requestHeaders.set(headerName, value);
  }

  const hasRequestBody = request.method !== "GET" && request.method !== "HEAD";
  const requestBody = hasRequestBody ? await request.arrayBuffer() : undefined;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: requestHeaders,
      body: requestBody?.byteLength ? requestBody : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    });

    const responseHeaders = new Headers();
    for (const headerName of RESPONSE_HEADERS) {
      const value = upstreamResponse.headers.get(headerName);
      if (value) responseHeaders.set(headerName, value);
    }
    if (!responseHeaders.has("cache-control")) {
      responseHeaders.set("cache-control", "no-store");
    }

    // The backend is on a different host. Forward its HttpOnly cookies as
    // host-only cookies from this same-origin route so Next.js Proxy and
    // Server Components can read the authenticated session on Vercel.
    const upstreamCookies = upstreamResponse.headers.getSetCookie();
    for (const cookie of upstreamCookies) {
      responseHeaders.append(
        "set-cookie",
        cookie.replace(/;\s*domain=[^;]*/gi, ""),
      );
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Backend API proxy request failed", error);
    }
    return Response.json(
      {
        detail: {
          code: "backend_unavailable",
          message: "The service is temporarily unavailable. Please try again.",
        },
      },
      { status: 502 },
    );
  }
}

export const GET = forwardToBackend;
export const HEAD = forwardToBackend;
export const POST = forwardToBackend;
export const PUT = forwardToBackend;
export const PATCH = forwardToBackend;
export const DELETE = forwardToBackend;
export const OPTIONS = forwardToBackend;
