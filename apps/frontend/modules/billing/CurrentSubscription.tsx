"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { useApiQuery } from "@/lib/use-api-query";
import type { Membership } from "./types";

export function CurrentSubscription() {
  const query = useApiQuery<Membership>("/billing/me");
  const membership = query.data;
  const error = !membership ? query.error?.message : undefined;
  const subscription = membership?.subscription;
  return (
    <Card padding="lg">
      <h2 className="text-lg font-bold">Current package</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Your subscribed package and current allowance.
      </p>
      {error ? (
        <div className="mt-5">
          <Alert variant="error">{error}</Alert>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Retry subscription
          </Button>
        </div>
      ) : !membership ? (
        <p className="mt-5 text-sm text-[var(--text-muted)]" role="status">
          Checking your subscription?
        </p>
      ) : (
        <>
          {subscription ? (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <h3 className="font-semibold">{subscription.package_name}</h3>
                <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-semibold capitalize">
                  {membership.status}
                </span>
              </div>
              <dl
                className="mt-5 grid gap-5 sm:grid-cols-2"
                aria-label="Subscription details"
              >
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    Monthly price
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: subscription.currency,
                    }).format(Number(subscription.monthly_price))}{" "}
                    / month
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    Personas used
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {membership.persona_count} of {subscription.persona_limit}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    {membership.status === "expired"
                      ? "Expired on"
                      : "Expires on"}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {new Date(subscription.expires_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Renewal</dt>
                  <dd className="mt-1 text-sm font-semibold">
                    Does not renew automatically
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="mt-5 text-sm text-[var(--text-muted)]">
              {membership.role === "user"
                ? "You haven’t subscribed to a package yet."
                : "Administrator access does not require a subscription."}
            </p>
          )}
          {(subscription || membership.role === "user") && (
            <Link href="/packages" className="button button-primary mt-6">
              <ArrowUpRight size={16} aria-hidden="true" />
              {!subscription
                ? "Choose a package"
                : membership.status === "expired"
                  ? "Renew or upgrade"
                  : "Upgrade package"}
            </Link>
          )}
        </>
      )}
    </Card>
  );
}
