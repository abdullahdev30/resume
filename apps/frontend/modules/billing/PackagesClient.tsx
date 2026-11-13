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
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [plans, current] = await Promise.all([
        apiClient<Package[]>("/billing/packages", { queryCache: false, retry: false }),
        apiClient<Membership>("/billing/me", { queryCache: false, retry: false }),
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
    const selectedPrice = priceFor(selected, billingInterval);
    if (selectedPrice === null) return;
    if (selectedPrice > 0) {
      setBusy(true);
      router.push(`/packages/checkout?packageId=${encodeURIComponent(selected.id)}&interval=${billingInterval}`);
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
    <main className={`${styles.page} ${styles.pricingPage}`}>
      <Link href="/settings?tab=package" className={styles.action}>
        Back to settings
      </Link>
      <PageHeader
        eyebrow="Your workspace"
        title="Choose your package"
        description="Choose a package and billing period. Paid plans renew manually after a verified Safepay payment."
      />
      <p className={styles.muted}>
        Safepay securely hosts checkout. Plans do not renew automatically; renew before the end date to keep access.
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
            <div className={`${styles.notice} ${styles.membership}`}>
              <div>
                <span className={styles.eyebrow}>Your subscription</span>
                <strong className={styles.membershipStatus}>{membership.status}</strong>
              </div>
              {membership.subscription && (
                <div className={styles.membershipDetails}>
                  <span>{membership.subscription.package_name} · {membership.subscription.billing_interval}</span>
                  <span>{membership.persona_count} / {membership.subscription.persona_limit} personas</span>
                  <span>{membership.ai_resume_count} / {membership.subscription.ai_resume_limit} AI resumes created this period</span>
                  <span>{membership.status === "expired" ? "Expired" : "Access through"} {new Date(membership.subscription.expires_at).toLocaleDateString()}</span>
                  <span>{membership.subscription.renewal_enabled ? "Automatic renewal on" : "Manual renewal"}</span>
                </div>
              )}
              {membership.subscription && membership.status === "active" &&
                new Date(membership.subscription.expires_at).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000 && (
                  <p className={styles.expiryNotice}>Your access ends soon. Renew manually to avoid an interruption.</p>
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
          <div className={styles.pricingHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Packages</h2>
              <p className={styles.muted}>Choose the capacity that fits your workflow.</p>
            </div>
            <div className={styles.intervalToggle} role="group" aria-label="Billing interval">
              <button type="button" aria-pressed={billingInterval === "monthly"} className={billingInterval === "monthly" ? styles.intervalActive : ""} onClick={() => setBillingInterval("monthly")}>Monthly</button>
              <button type="button" aria-pressed={billingInterval === "yearly"} className={billingInterval === "yearly" ? styles.intervalActive : ""} onClick={() => setBillingInterval("yearly")}>Yearly</button>
            </div>
          </div>
          <div className={`${styles.grid} ${styles.pricingGrid}`}>
            {packages.map((plan) => {
              const current =
                membership?.status === "active" &&
                membership.subscription?.package_id === plan.id &&
                membership.subscription?.billing_interval === (Number(plan.monthly_price) === 0 ? "monthly" : billingInterval);
              const currentExpiresSoon = current && membership?.subscription?.expires_at
                ? new Date(membership.subscription.expires_at).getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000
                : false;
              const tooSmall =
                (membership?.persona_count ?? 0) > plan.persona_limit;
              const price = priceFor(plan, Number(plan.monthly_price) === 0 ? "monthly" : billingInterval);
              const savings = plan.yearly_price == null || Number(plan.yearly_price) <= 0 ? 0 : Math.round((1 - Number(plan.yearly_price) / (Number(plan.monthly_price) * 12)) * 100);
              const intervalUnavailable = billingInterval === "yearly" && Number(plan.monthly_price) > 0 && (plan.yearly_price == null || Number(plan.yearly_price) <= 0);
              return (
                <article className={`${styles.card} ${styles.pricingCard} ${current ? styles.currentCard : ""}`} key={plan.id}>
                  {current && <span className={styles.currentLabel}>{currentExpiresSoon ? "Renewal window open" : "Current plan"}</span>}
                  <div className={styles.planHeading}><h3>{plan.name}</h3></div>
                  <p className={styles.planDescription}>{plan.description || "Access to the resume workspace and saved personas."}</p>
                  <p className={styles.planIntro}>Includes</p>
                  <ul className={styles.featureList}>
                    <li><span aria-hidden="true">{"\u2713"}</span><strong>{plan.persona_limit}</strong> {plan.persona_limit === 1 ? "persona" : "personas"}</li>
                    <li><span aria-hidden="true">{"\u2713"}</span><strong>{plan.ai_resume_limit}</strong> AI-created {plan.ai_resume_limit === 1 ? "resume" : "resumes"} per billing period</li>
                    <li><span aria-hidden="true">{"\u2713"}</span>Edit and refine saved resumes anytime</li>
                    <li><span aria-hidden="true">{"\u2713"}</span>Saved resumes in your account</li>
                  </ul>
                  <p className={styles.price}>
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: plan.currency,
                    }).format(price ?? Number(plan.monthly_price))}
                    <span className={styles.muted}> / {price === 0 ? "month" : billingInterval === "yearly" ? "year" : "month"}</span>
                  </p>
                  {billingInterval === "yearly" && price !== null && price > 0 && <p className={styles.yearlyNote}>Billed yearly · equivalent to {new Intl.NumberFormat(undefined, { style: "currency", currency: plan.currency }).format(price / 12)} / month</p>}
                  {billingInterval === "yearly" && savings > 0 && <p className={styles.savings}>Save {savings}% compared with monthly billing</p>}
                  {intervalUnavailable && <p className={styles.unavailable}>Yearly pricing is not configured for this package.</p>}
                  <button
                    className={`${styles.primary} ${styles.subscribeButton}`}
                    disabled={busy || (current && !currentExpiresSoon) || tooSmall || intervalUnavailable}
                    onClick={() => {
                      setSelected(plan);
                      setMessage("");
                    }}
                  >
                    {current
                      ? currentExpiresSoon ? "Renew package" : "Current package"
                      : membership?.status === "expired" &&
                          membership.subscription?.package_id === plan.id
                        ? "Renew package"
                        : "Select package"}
                  </button>
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
              {Number(priceFor(selected, billingInterval) ?? 0) > 0
                ? "You will continue to Safepay to pay securely. Your package changes after the payment is verified."
                : "This activates the free package for one month and replaces your current package."}
            </p>
            <button
              className={styles.primary}
              disabled={busy}
              onClick={() => void subscribe()}
            >
              {busy
                ? "Opening checkout..."
                : Number(priceFor(selected, billingInterval) ?? 0) > 0
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

function priceFor(plan: Package, interval: "monthly" | "yearly"): number | null {
  if (interval === "yearly" && Number(plan.monthly_price) > 0) {
    return plan.yearly_price == null || Number(plan.yearly_price) <= 0 ? null : Number(plan.yearly_price);
  }
  return Number(plan.monthly_price);
}
