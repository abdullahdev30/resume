import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/backend-api-url";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order_id");
  if (!orderId) return NextResponse.json({ detail: "order_id is required." }, { status: 400 });
  const response = await fetch(
    `${BACKEND_API_BASE}/billing/payment/status?order_id=${encodeURIComponent(orderId)}`,
    { headers: { cookie: request.headers.get("cookie") || "" }, cache: "no-store" },
  );
  return NextResponse.json(await response.json(), { status: response.status });
}
