"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/feedback/Alert";
import { useApiQuery } from "@/lib/use-api-query";
import type { SubscriptionHistoryItem } from "./types";

export function SubscriptionHistory() {
  const [open, setOpen] = useState(false);

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Subscription history</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Review your previous packages, billing periods, and access dates.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          aria-expanded={open}
          aria-controls="subscription-history-content"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide history" : "View subscription history"}
        </Button>
      </div>
      {open && (
        <div id="subscription-history-content" className="mt-5">
          <HistoryRows />
        </div>
      )}
    </Card>
  );
}

function HistoryRows() {
  const query = useApiQuery<SubscriptionHistoryItem[]>("/billing/history");
  if (query.error) {
    return (
      <div>
        <Alert variant="error">{query.error.message}</Alert>
        <Button variant="secondary" className="mt-3" onClick={() => void query.refetch()}>
          Retry history
        </Button>
      </div>
    );
  }
  if (!query.data) {
    return <p className="text-sm text-[var(--text-muted)]" role="status">Loading subscription history…</p>;
  }
  if (!query.data.length) {
    return <p className="text-sm text-[var(--text-muted)]">No subscription history yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border)]">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[var(--surface-subtle)] text-xs text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Package</th>
            <th className="px-4 py-3 font-semibold">Billing</th>
            <th className="px-4 py-3 font-semibold">Price</th>
            <th className="px-4 py-3 font-semibold">Access period</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {query.data.map((item) => (
            <tr key={item.id} className="border-t border-[var(--border)]">
              <td className="px-4 py-3 align-top">
                <span className="block font-semibold">{item.package_name}</span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">
                  {item.persona_limit} personas · {item.ai_resume_limit} AI resumes
                </span>
              </td>
              <td className="px-4 py-3 align-top capitalize">{item.billing_interval}</td>
              <td className="px-4 py-3 align-top whitespace-nowrap">
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: item.currency,
                }).format(Number(item.amount))}
                <span className="text-[var(--text-muted)]"> / {item.billing_interval === "yearly" ? "year" : "month"}</span>
              </td>
              <td className="px-4 py-3 align-top whitespace-nowrap">
                {formatDate(item.starts_at)} – {formatDate(item.expires_at)}
              </td>
              <td className="px-4 py-3 align-top capitalize">{item.current_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
