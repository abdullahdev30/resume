import { getSessionUser } from "@/modules/auth/server";
import { AppShellServer as AppShell } from "@/modules/layout/AppShellServer";
import { ResumeListClient } from "@/modules/resume/components/ResumeListClient";
import { listResumesOnServer } from "@/modules/resume/server";

export default async function ResumesPage() {
  const sessionUser = await getSessionUser();
  const isGuest = Boolean(sessionUser?.is_guest);
  const isRegistered = Boolean(sessionUser && !isGuest);
  const resumes = sessionUser ? await listResumesOnServer() : null;

  return (
    <AppShell user={isRegistered ? sessionUser : null}>
      <ResumeListClient
        initialResumes={resumes || undefined}
        hasSession={Boolean(sessionUser)}
        isGuest={isGuest}
      />
    </AppShell>
  );
}
