import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/backend-api-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.arrayBuffer();
  const headers = new Headers();
  for (const name of ["content-type", "x-sfpy-signature", "x-sfpy-event-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const response = await fetch(`${BACKEND_API_BASE}/webhooks/safepay`, {
    method: "POST", headers, body: rawBody, cache: "no-store",
  });
  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" },
  });
}
