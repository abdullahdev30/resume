import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { ResumeListClient } from "@/modules/resume/components/ResumeListClient";
export default async function ResumesPage() {
  const user = await requireCurrentUser();
  return (
    <AppShellServer user={user}>
      <ResumeListClient />
    </AppShellServer>
  );
}
