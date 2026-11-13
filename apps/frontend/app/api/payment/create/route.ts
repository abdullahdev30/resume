import { NextRequest, NextResponse } from "next/server";
import Safepay from "@sfpy/node-core";
import { BACKEND_API_BASE } from "@/lib/backend-api-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.SAFEPAY_SECRET_KEY;
  const publicKey = process.env.SAFEPAY_PUBLIC_KEY;
  const host = process.env.SAFEPAY_HOST || "https://sandbox.api.getsafepay.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!secret || !publicKey) {
    console.error("Safepay checkout unavailable: required server environment settings are missing.");
    return NextResponse.json({ detail: "Safepay is not configured." }, { status: 503 });
  }

  const cookies = request.headers.get("cookie") || "";
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid checkout request." }, { status: 400 });
  }
  let order: { order_id: string; amount: number; currency: string; tracker_token?: string | null };
  try {
    const initResponse = await fetch(`${BACKEND_API_BASE}/billing/payment/init`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookies },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = await initResponse.json();
    if (!initResponse.ok) return NextResponse.json(result, { status: initResponse.status });
    order = result;
  } catch {
    console.error("Safepay order initialization failed while contacting the billing backend.");
    return NextResponse.json({ detail: "Unable to contact the billing service." }, { status: 502 });
  }

  try {
    const safepay = new Safepay(secret, { authType: "secret", host });
    let tracker = order.tracker_token;
    if (!tracker) {
      const setup = await safepay.payments.session.setup({
        merchant_api_key: publicKey,
        intent: "CYBERSOURCE",
        mode: "payment",
        currency: order.currency,
        amount: order.amount,
        metadata: { order_id: order.order_id },
      });
      tracker = setup?.data?.tracker?.token || setup?.data?.token || setup?.tracker?.token;
    }
    if (!tracker) throw new Error("Safepay did not return a tracker token.");
    const passport = await safepay.client.passport.create();
    const tbt = passport?.data?.token || passport?.data || passport?.token;
    if (!tbt) throw new Error("Safepay did not return a checkout token.");
    const bindResponse = await fetch(`${BACKEND_API_BASE}/billing/payment/tracker`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookies },
      body: JSON.stringify({ order_id: order.order_id, tracker_token: tracker }),
      cache: "no-store",
    });
    if (!bindResponse.ok) throw new Error("Unable to associate the Safepay tracker with the order.");
    const checkoutUrl = safepay.checkout.createCheckoutUrl({
      env: "sandbox",
      tbt,
      tracker,
      source: "hosted",
      order_id: order.order_id,
      redirect_url: `${appUrl}/packages/checkout?payment=return&orderId=${encodeURIComponent(order.order_id)}`,
      cancel_url: `${appUrl}/packages/checkout?payment=cancelled&orderId=${encodeURIComponent(order.order_id)}`,
    });
    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (error) {
    const providerError = error && typeof error === "object"
      ? error as { name?: string; type?: string; status?: number }
      : {};
    console.error("Safepay hosted checkout initialization failed.", {
      type: providerError.type || providerError.name || "UnknownError",
      status: providerError.status,
    });
    await fetch(`${BACKEND_API_BASE}/billing/payment/fail`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookies },
      body: JSON.stringify({ order_id: order.order_id }),
      cache: "no-store",
    }).catch(() => undefined);
    return NextResponse.json({ detail: "Unable to start checkout. Please retry." }, { status: 502 });
  }
}
