import { requireCurrentUser } from "@/modules/auth/server";
import { AppShell } from "@/modules/layout/AppShell";
import { ResumeListClient } from "@/modules/resume/components/ResumeListClient";

export default async function ResumesPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <ResumeListClient />
    </AppShell>
  );
}
