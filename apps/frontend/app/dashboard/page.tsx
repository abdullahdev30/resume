import { getCurrentUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import DashboardClient from "./DashboardClient";
import { listResumesOnServer } from "../../modules/resume/server";
import { getProfileOnServer } from "../../modules/profile/server";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [resumes, profile] = user
    ? await Promise.all([listResumesOnServer(), getProfileOnServer()])
    : [null, null];

  return (
    <AppShell user={user} initialProfile={profile}>
      <DashboardClient
        initialResumes={resumes || undefined}
        initialProfileIncomplete={user ? !profile?.personal.phone || !profile?.personal.email : undefined}
        isAuthenticated={Boolean(user)}
      />
    </AppShell>
  );
}
