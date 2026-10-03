import type React from "react";

import type { User } from "@/modules/auth/types";
import { getProfileOnServer } from "@/modules/profile/server";
import type { ProfileResponse } from "@/modules/profile/types";
import { AppShell } from "./AppShell";

export async function AppShellServer({
  user,
  initialProfile,
  children,
}: {
  user: User | null;
  initialProfile?: ProfileResponse | null;
  children: React.ReactNode;
}) {
  const profile = user && initialProfile === undefined
    ? await getProfileOnServer()
    : initialProfile;
  const profileName = [
    profile?.personal.first_name || profile?.personal.name,
    profile?.personal.last_name,
  ].filter(Boolean).join(" ");
  return (
    <AppShell
      user={user}
      initialAvatarUrl={profile?.personal.avatar_url || ""}
      initialDisplayName={profileName || undefined}
    >
      {children}
    </AppShell>
  );
}
