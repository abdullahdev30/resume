import { getCurrentUser } from "@/modules/auth/server";
import { AppShellServer as AppShell } from "@/modules/layout/AppShellServer";
import { ResumeListClient } from "@/modules/resume/components/ResumeListClient";
import { listResumesOnServer } from "@/modules/resume/server";

export default async function ResumesPage() {
  const user = await getCurrentUser();
  const resumes = user ? await listResumesOnServer() : null;

  return (
    <AppShell user={user}>
      <ResumeListClient initialResumes={resumes || undefined} isAuthenticated={Boolean(user)} />
    </AppShell>
  );
}
