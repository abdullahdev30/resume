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
  user: User;
  initialProfile?: ProfileResponse | null;
  children: React.ReactNode;
}) {
  const profile = initialProfile === undefined ? await getProfileOnServer() : initialProfile;
  return (
    <AppShell user={user} initialAvatarUrl={profile?.personal.avatar_url || ""}>
      {children}
    </AppShell>
  );
}
