import { requireCurrentUser } from "@/modules/auth/server";
import { AppShell } from "@/modules/layout/AppShell";
import { ResumeViewClient } from "@/modules/resume/components/ResumeViewClient";

export default async function ResumeDetailPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <ResumeViewClient />
    </AppShell>
  );
}
