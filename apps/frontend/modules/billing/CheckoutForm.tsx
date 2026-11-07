"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { Membership } from "./types";
import styles from "./billing.module.css";

type CheckoutSdk = {
  createForm(options: { layout: "expanded" }): {
    mount(target: string): void;
    destroy(): void;
    on(event: "confirm", handler: (event: unknown) => Promise<void>): void;
  };
  loadActions(): Promise<
    | {
        type: "success";
        actions: {
          confirm(options: {
            formConfirmEvent: unknown;
          }): Promise<{ type: string; error?: { message?: string } }>;
        };
      }
    | { type: "error"; error: { message: string } }
  >;
};

const appearance = {
  theme: "flat",
  labels: "auto",
  inputs: "spaced",
  variables: {
    borderRadius: "4px",
    colorBackground: "#ffffff",
    colorDanger: "#df1b41",
    colorPrimary: "#0570de",
    colorSuccess: "#00c853",
    colorText: "#30313d",
    fontFamily: "default",
    fontSizeBase: "16px",
    spacingUnit: "4px",
  },
};

export function CheckoutForm({ packageId }: { packageId: string }) {
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let form: ReturnType<CheckoutSdk["createForm"]> | undefined;
    setError("");
    setLoading(true);
    async function start() {
      try {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!key || key === "pk_test_...")
          throw new Error("Stripe publishable key is not configured.");
        const stripeWindow = window as unknown as {
          Stripe?: (key: string) => {
            initCheckoutFormSdk(options: {
              clientSecret: string;
              appearance: typeof appearance;
            }): CheckoutSdk;
          };
        };
        for (let i = 0; !stripeWindow.Stripe && i < 100 && !cancelled; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (cancelled) return;
        if (!stripeWindow.Stripe)
          throw new Error("Stripe could not load. Please retry.");
        if (!packageId) throw new Error("Choose a package before opening checkout.");
        const { client_secret } = await apiClient<{ client_secret: string }>(
          "/billing/create-checkout-session",
          { method: "POST", body: { package_id: packageId }, retry: false },
        );
        if (cancelled) return;
        if (!client_secret)
          throw new Error("Checkout did not return a client secret.");
        const checkout = stripeWindow
          .Stripe(key)
          .initCheckoutFormSdk({ clientSecret: client_secret, appearance });
        form = checkout.createForm({ layout: "expanded" });
        const result = await checkout.loadActions();
        if (cancelled) return;
        if (result.type !== "success") throw new Error(result.error.message);
        form.on("confirm", async (event) => {
          setError("");
          try {
            const confirmation = await result.actions.confirm({
              formConfirmEvent: event,
            });
            if (cancelled) return;
            if (confirmation.type === "error")
              throw new Error(
                confirmation.error?.message || "Payment failed. Please retry.",
              );
            setSubmitted(true);
          } catch (err) {
            if (!cancelled)
              setError(
                err instanceof Error
                  ? err.message
                  : "Payment confirmation failed.",
              );
          }
        });
        form.mount("#checkout-form");
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load checkout.",
          );
          setLoading(false);
        }
      }
    }
    void start();
    return () => {
      cancelled = true;
      form?.destroy();
    };
  }, [attempt, packageId]);

  useEffect(() => {
    if (!submitted || complete) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void apiClient<Membership>("/billing/me", { queryCache: false, retry: false })
        .then((membership) => {
          if (membership.subscription?.package_id === packageId && membership.status === "active") {
            setComplete(true);
            window.clearInterval(timer);
          }
        })
        .catch(() => undefined);
      if (attempts >= 30) window.clearInterval(timer);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [submitted, complete, packageId]);

  return (
    <main className={styles.page}>
      <Link href="/packages">Back to packages</Link>
      <h1>Checkout</h1>
      {loading && <p role="status">Loading secure checkout...</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((value) => value + 1)}>
            Retry
          </button>
        </p>
      )}
      {complete && (
        <p role="status">
          Payment verified. Your package is active.
        </p>
      )}
      {submitted && !complete && (
        <p role="status">Payment submitted. Waiting for Stripe to verify payment and activate your package.</p>
      )}
      <div id="checkout-form" />
    </main>
  );
}
