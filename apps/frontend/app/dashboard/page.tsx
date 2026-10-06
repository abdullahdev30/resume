import { getSessionUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import DashboardClient from "./DashboardClient";
import { listResumesOnServer } from "../../modules/resume/server";
import { getProfileOnServer } from "../../modules/profile/server";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();
  const isGuest = Boolean(sessionUser?.is_guest);
  const isRegistered = Boolean(sessionUser && !isGuest);
  const [resumes, profile] = sessionUser
    ? await Promise.all([
        listResumesOnServer(),
        isRegistered ? getProfileOnServer() : Promise.resolve(null),
      ])
    : [null, null];

  return (
    <AppShell user={isRegistered ? sessionUser : null} initialProfile={profile}>
      <DashboardClient
        initialResumes={resumes || undefined}
        initialProfileIncomplete={isRegistered ? !profile?.personal.phone || !profile?.personal.email : undefined}
        hasSession={Boolean(sessionUser)}
        isGuest={isGuest}
      />
    </AppShell>
  );
}
