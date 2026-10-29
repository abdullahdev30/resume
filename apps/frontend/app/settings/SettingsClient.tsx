"use client";

import Link from "next/link";
import { LockKeyhole, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { useApiQuery } from "@/lib/use-api-query";
import type { AccountProfile, User } from "@/modules/auth/types";

export default function SettingsClient({ user }: { user: User }) {
  const account = useApiQuery<AccountProfile>("/auth/profile");
  const profile = account.data;
  const error = profile ? "" : account.error?.message || "";
  return (
    <div className="page-stack max-w-3xl">
      <PageHeader
        title="Settings"
        description="Your account profile and sign-in security."
      />
      <Card padding="lg">
        <h2 className="text-lg font-bold">Account profile</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          These are the details used to create your account. Each persona has
          its own independent information.
        </p>
        {error ? (
          <div className="mt-5">
            <Alert variant="error">{error}</Alert>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => void account.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : !profile ? (
          <LoadingState label="Loading account profile..." cards={1} />
        ) : (
          <dl
            className="mt-6 grid gap-5 sm:grid-cols-2"
            aria-label="Account profile details"
          >
            {[
              ["Full name", profile.name],
              ["Email", profile.email],
              ["Phone number", profile.phone],
              [
                "Email verification",
                profile.email_verified ? "Verified" : "Not verified",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
                <dd className="mt-1 break-words text-sm font-semibold">
                  {value || "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
      <Card padding="lg">
        <h2 className="text-lg font-bold">Account security</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Signed in as {profile?.email || user.email}
        </p>
        <Link
          href="/auth/change-password"
          className="button button-secondary mt-5"
        >
          <LockKeyhole size={16} aria-hidden="true" />
          Change password
        </Link>
      </Card>
      <Card padding="lg">
        <h2 className="text-lg font-bold">Personas</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Create a persona using a copy of your account details, or start with
          different information. Editing or deleting a persona never changes
          your account profile.
        </p>
        <Link href="/persona" className="button button-primary mt-5">
          <Users size={16} aria-hidden="true" />
          Open Persona
        </Link>
      </Card>
    </div>
  );
}
