import { requireCurrentUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import DashboardClient from "./DashboardClient";
import { listResumesOnServer } from "../../modules/resume/server";
import { getProfileOnServer } from "../../modules/profile/server";

export default async function DashboardPage() {
  const [user, resumes, profile] = await Promise.all([
    requireCurrentUser(),
    listResumesOnServer(),
    getProfileOnServer(),
  ]);

  return (
    <AppShell user={user} initialProfile={profile}>
      <DashboardClient
        initialResumes={resumes || undefined}
        initialProfileIncomplete={!profile?.personal.phone || !profile?.personal.email}
      />
    </AppShell>
  );
}
