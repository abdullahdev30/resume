import type React from "react";

import type { User } from "@/modules/auth/types";
import type { ProfileResponse } from "@/modules/profile/types";
import { AppShell } from "./AppShell";

export async function AppShellServer({
  user,
  children,
}: {
  user: User | null;
  initialProfile?: ProfileResponse | null;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      user={user}
      initialAvatarUrl=""
      initialDisplayName={user?.name || undefined}
    >
      {children}
    </AppShell>
  );
}
