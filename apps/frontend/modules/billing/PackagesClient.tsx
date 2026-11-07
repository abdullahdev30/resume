"use client";

import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { apiClient } from "@/lib/api-client";
import type { Membership, Package } from "./types";
import styles from "./billing.module.css";

export function PackagesClient() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Package | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [plans, current] = await Promise.all([
        apiClient<Package[]>("/billing/packages", { queryCache: false }),
        apiClient<Membership>("/billing/me", { queryCache: false }),
      ]);
      setPackages(plans);
      setMembership(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load packages.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function subscribe() {
    if (!selected || busy) return;
    if (Number(selected.monthly_price) > 0) {
      router.push(`/packages/checkout?packageId=${encodeURIComponent(selected.id)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiClient("/billing/subscribe", {
        method: "POST",
        body: { package_id: selected.id },
      });
      setSelected(null);
      setMessage("Your free package is active.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to subscribe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/settings?tab=package" className={styles.action}>
        Back to settings
      </Link>
      <PageHeader
        eyebrow="Your workspace"
        title="Choose your package"
        description="Select the number of personas you need. Subscriptions last one calendar month and do not renew automatically."
      />
      <p className={styles.muted}>
        Paid packages are purchased securely through Stripe. Package access starts after the payment is verified and lasts one month without automatic renewal.
      </p>
      {error && (
        <div className={styles.error} role="alert">
          {error} <button onClick={() => void load()}>Retry</button>
        </div>
      )}
      {message && (
        <div className={styles.success} role="status">
          {message}
        </div>
      )}
      {loading ? (
        <p role="status">Loading packages…</p>
      ) : (
        <>
          {membership && (
            <div className={styles.notice}>
              <strong>Subscription: {membership.status}</strong>
              {membership.subscription && (
                <p>
                  {membership.subscription.package_name} ·{" "}
                  {membership.persona_count} /{" "}
                  {membership.subscription.persona_limit} personas ·{" "}
                  {membership.status === "expired" ? "Expired" : "Expires"}{" "}
                  {new Date(
                    membership.subscription.expires_at,
                  ).toLocaleString()}
                </p>
              )}
              {membership.status === "active" && (
                <Link className={styles.action} href="/persona">
                  Continue to personas
                </Link>
              )}
              {membership.status !== "active" && (
                <p>
                  Select a package to create and edit personas and resumes. Your
                  existing work is preserved.
                </p>
              )}
            </div>
          )}
          {!packages.length && !error && (
            <div className={styles.notice}>
              No packages are available yet. Please contact an administrator.
            </div>
          )}
          <div className={styles.grid}>
            {packages.map((plan) => {
              const current =
                membership?.status === "active" &&
                membership.subscription?.package_id === plan.id;
              const tooSmall =
                (membership?.persona_count ?? 0) > plan.persona_limit;
              return (
                <article className={styles.card} key={plan.id}>
                  <h2>{plan.name}</h2>
                  <p>{plan.description}</p>
                  <p className={styles.price}>
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: plan.currency,
                    }).format(Number(plan.monthly_price))}
                    <span className={styles.muted}> / month</span>
                  </p>
                  <p>Up to {plan.persona_limit} personas</p>
                  <button
                    className={styles.primary}
                    disabled={busy || current || tooSmall || (Number(plan.monthly_price) > 0 && !plan.stripe_price_id)}
                    onClick={() => {
                      setSelected(plan);
                      setMessage("");
                    }}
                  >
                    {current
                      ? "Current package"
                      : membership?.status === "expired" &&
                          membership.subscription?.package_id === plan.id
                        ? "Renew package"
                        : "Select package"}
                  </button>
                  {Number(plan.monthly_price) > 0 && !plan.stripe_price_id && (
                    <p className={styles.muted}>Payment setup is not complete for this package yet.</p>
                  )}
                  {tooSmall && (
                    <p className={styles.muted}>
                      You have {membership?.persona_count} personas. Remove some
                      before selecting this package.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
      {selected && (
        <Dialog
          open
          title="Confirm package selection"
          preventClose={busy}
          onClose={() => setSelected(null)}
        >
          <div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <h2>Subscribe to {selected.name}?</h2>
            <p>
              {Number(selected.monthly_price) > 0
                ? "You will continue to Stripe to pay securely. Your package changes after the payment is verified."
                : "This activates the free package for one month and replaces your current package."}
            </p>
            <button
              className={styles.primary}
              disabled={busy}
              onClick={() => void subscribe()}
            >
              {busy
                ? "Opening checkout..."
                : Number(selected.monthly_price) > 0
                  ? "Continue to payment"
                  : "Activate free package"}
            </button>
            <button disabled={busy} onClick={() => setSelected(null)}>
              Cancel
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
