import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer as AppShell } from "@/modules/layout/AppShellServer";
import { ResumeListClient } from "@/modules/resume/components/ResumeListClient";
import { listResumesOnServer } from "@/modules/resume/server";

export default async function ResumesPage() {
  const [user, resumes] = await Promise.all([
    requireCurrentUser(),
    listResumesOnServer(),
  ]);

  return (
    <AppShell user={user}>
      <ResumeListClient initialResumes={resumes || undefined} />
    </AppShell>
  );
}
