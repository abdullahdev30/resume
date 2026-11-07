"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Package } from "@/modules/billing/types";
import styles from "./LandingPage.module.css";

export function LandingPricing() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiClient<Package[]>("/public/packages", {
      queryCache: false,
      signal: controller.signal,
    })
      .then(setPackages)
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error ? err.message : "Packages couldn’t be loaded.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <div className={styles.pricingGrid}>
      <article className={styles.plan}>
        <span className={styles.planLabel}>A place to begin</span>
        <h3>Free editor</h3>
        <p className={styles.planDescription}>
          A simple resume, right in your browser.
        </p>
        <p className={styles.price}>Free</p>
        <ul>
          <li>
            <Check size={15} aria-hidden="true" /> Customizable resume
          </li>
          <li>
            <Check size={15} aria-hidden="true" /> Download as PDF
          </li>
          <li>
            <Check size={15} aria-hidden="true" /> No account required
          </li>
        </ul>
        <Link href="/templates" className={styles.secondary}>
          Create a resume
        </Link>
        <span className={styles.noCharge}>Your draft stays in this tab</span>
      </article>
      {loading ? (
        [1, 2].map((item) => (
          <div
            key={item}
            className={`${styles.plan} ${styles.skeleton}`}
            role="status"
            aria-label="Loading package"
          >
            <span />
            <span />
            <span />
            <span />
          </div>
        ))
      ) : error ? (
        <div className={styles.pricingState} role="alert">
          <h3>Packages are temporarily unavailable.</h3>
          <p>
            You can still use the free editor. Try again to load the latest
            packages.
          </p>
          <button
            className={styles.secondary}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry packages
          </button>
        </div>
      ) : !packages.length ? (
        <div className={styles.pricingState}>
          <h3>Account packages are on their way.</h3>
          <p>
            No packages are available yet. Start with the free editor and check
            back for account plans.
          </p>
        </div>
      ) : (
        packages.map((plan) => (
          <article
            key={plan.id}
            className={`${styles.plan} ${styles.accountPlan}`}
          >
            <span className={styles.planLabel}>Account workspace</span>
            <h3>{plan.name}</h3>
            <p className={styles.planDescription}>
              {plan.description ||
                `Room for up to ${plan.persona_limit} personas.`}
            </p>
            <p className={styles.price}>
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: plan.currency,
              }).format(Number(plan.monthly_price))}
              <small> / month</small>
            </p>
            <ul>
              <li>
                <Check size={15} aria-hidden="true" /> {plan.persona_limit}{" "}
                {plan.persona_limit === 1 ? "persona" : "personas"}
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> Saved resumes in your
                account
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> One-month subscription
              </li>
            </ul>
            <Link href="/auth/register" className={styles.primary}>
              Choose {plan.name}
            </Link>
            <span className={styles.noCharge}>No payment collected yet</span>
          </article>
        ))
      )}
    </div>
  );
}
