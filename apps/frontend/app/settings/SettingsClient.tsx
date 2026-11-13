"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  UserRound,
  Package,
  ShieldCheck,
  LockKeyhole,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { useApiQuery } from "@/lib/use-api-query";
import type { AccountProfile, User } from "@/modules/auth/types";
import styles from "./SettingsClient.module.css";
import { CurrentSubscription } from "@/modules/billing/CurrentSubscription";
import { SubscriptionHistory } from "@/modules/billing/SubscriptionHistory";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getResumeLanguagePreference, setResumeLanguagePreference } from "@/lib/resume-language-preference";
import type { LanguageCode } from "@/lib/languages";

export default function SettingsClient({ user }: { user: User }) {
  const params = useSearchParams();
  const { language, setLanguage, t } = useLanguage();
  const [resumeLanguage, setResumeLanguage] = useState<LanguageCode>("en");
  useEffect(() => setResumeLanguage(getResumeLanguagePreference()), []);
  const updateResumeLanguage = (value: LanguageCode) => {
    setResumeLanguage(value);
    setResumeLanguagePreference(value);
  };
  const requestedTab = params.get("tab");
  const tab =
    requestedTab === "package" || requestedTab === "security"
      ? requestedTab
      : "profile";
  const tabs = [
    { id: "profile", label: "Profile", icon: UserRound },
    { id: "package", label: "Package", icon: Package },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];
  const selectTab = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  };
  const account = useApiQuery<AccountProfile>("/auth/profile", {
    initialData: {
      id: user.id,
      name: user.name || null,
      email: user.email,
      phone: user.number || null,
      email_verified: Boolean(user.email_verified),
    },
  });
  const profile = account.data;
  const error = profile ? "" : account.error?.message || "";
  return (
    <div className="page-stack max-w-6xl">
      <PageHeader
        title="Settings"
        description="Your account profile, subscription, and sign-in security."
      />
      <div className={styles.layout}>
        <nav
          className={styles.tabs}
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="vertical"
        >
          {tabs.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              id={`settings-tab-${id}`}
              role="tab"
              type="button"
              aria-selected={tab === id}
              aria-controls={`settings-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => selectTab(id)}
              onKeyDown={(event) => {
                const delta =
                  event.key === "ArrowDown" || event.key === "ArrowRight"
                    ? 1
                    : event.key === "ArrowUp" || event.key === "ArrowLeft"
                      ? -1
                      : 0;
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : delta
                        ? (index + delta + tabs.length) % tabs.length
                        : -1;
                if (next >= 0) {
                  event.preventDefault();
                  const target = tabs[next]!.id;
                  selectTab(target);
                  document.getElementById(`settings-tab-${target}`)?.focus();
                }
              }}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        <div
          className={styles.panel}
          id="settings-panel-profile"
          role="tabpanel"
          aria-labelledby="settings-tab-profile"
          hidden={tab !== "profile"}
        >
          <Card padding="lg">
            <h2 className="text-lg font-bold">{t("Language preferences")}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Choose the app language and the default language for resume content separately.</p>
            <div className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
              <LanguageSelect id="settings-app-language" value={language} onChange={setLanguage} label="App language" />
              <LanguageSelect id="settings-resume-language" value={resumeLanguage} onChange={updateResumeLanguage} label="Resume language" />
            </div>
          </Card>
          <Card padding="lg">
            <h2 className="text-lg font-bold">{t("Account profile")}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              These are the details used to create your account. Each persona
              has its own independent information.
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
            ) : (
              <dl
                className="mt-6 grid gap-5 sm:grid-cols-2"
                aria-label="Account profile details"
              >
                {[
                  ["Full name", profile?.name],
                  ["Email", profile?.email],
                  ["Phone number", profile?.phone],
                  [
                    "Email verification",
                    profile?.email_verified ? "Verified" : "Not verified",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-[var(--text-muted)]">
                      {label}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-semibold">
                      {value || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
          <Card padding="lg">
            <h2 className="text-lg font-bold">Personas</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Create a persona using a copy of your account details, or start
              with different information. Editing or deleting a persona never
              changes your account profile.
            </p>
            <Link href="/persona" className="button button-primary mt-5">
              <Users size={16} aria-hidden="true" />
              Open Persona
            </Link>
          </Card>
        </div>
        <div
          className={styles.panel}
          id="settings-panel-package"
          role="tabpanel"
          aria-labelledby="settings-tab-package"
          hidden={tab !== "package"}
        >
          <CurrentSubscription />
          <SubscriptionHistory />
        </div>
        <div
          className={styles.panel}
          id="settings-panel-security"
          role="tabpanel"
          aria-labelledby="settings-tab-security"
          hidden={tab !== "security"}
        >
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
        </div>
      </div>
    </div>
  );
}
