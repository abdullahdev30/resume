"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./billing.module.css";

export function CheckoutForm({ packageId, billingInterval }: { packageId: string; billingInterval: "monthly" | "yearly" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [cancelledCheckout, setCancelledCheckout] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function start() {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId");
      if (params.get("payment") === "return" && orderId) {
        try {
          const status = await getPaymentStatus(orderId);
          if (!cancelled && status.status === "paid") setComplete(true);
          else if (!cancelled) setError("Payment is being verified. This page will update when Safepay confirms it.");
        } catch {
          if (!cancelled) setError("Unable to check payment status. Please retry.");
        }
        return;
      }
      if (params.get("payment") === "cancelled") {
        setCancelledCheckout(true);
        setError("Checkout was cancelled. You can return to packages and try again.");
        return;
      }
      if (!packageId) { setError("Choose a package before opening checkout."); return; }
      if (!idempotencyKey) { setIdempotencyKey(crypto.randomUUID()); return; }
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/payment/create", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ package_id: packageId, billing_interval: billingInterval, idempotency_key: idempotencyKey }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail || "Unable to start checkout.");
        if (!payload.checkout_url) throw new Error("Safepay did not return a checkout URL.");
        window.location.assign(payload.checkout_url);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load checkout.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void start();
    return () => { cancelled = true; };
  }, [attempt, packageId, billingInterval, idempotencyKey]);

  useEffect(() => {
    if (!error.startsWith("Payment is being verified")) return;
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    if (!orderId) return;
    let count = 0;
    const timer = window.setInterval(() => {
      count++;
      void getPaymentStatus(orderId).then((status) => {
        if (status.status === "paid") { setComplete(true); setError(""); window.clearInterval(timer); }
        if (status.status === "failed") { setError("Payment was not successful. You can try again from packages."); window.clearInterval(timer); }
      }).catch(() => undefined);
      if (count >= 30) window.clearInterval(timer);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [error]);

  return (
    <main className={styles.page}>
      <Link href="/packages">Back to packages</Link>
      <h1>Secure checkout</h1>
      {loading && <p role="status">Redirecting to Safepay...</p>}
      {error && <p role="alert">{error} {!cancelledCheckout && <button onClick={() => { setIdempotencyKey(crypto.randomUUID()); setAttempt((value) => value + 1); }}>Retry</button>}</p>}
      {complete && <p role="status">Payment verified. Your package is active.</p>}
    </main>
  );
}

async function getPaymentStatus(orderId: string): Promise<{ status: string; package_id: string }> {
  const response = await fetch(`/api/payment/status?order_id=${encodeURIComponent(orderId)}`, {
    credentials: "include", cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || "Unable to check payment status.");
  return result;
}
