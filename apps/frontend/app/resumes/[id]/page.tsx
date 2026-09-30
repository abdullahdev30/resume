import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer as AppShell } from "@/modules/layout/AppShellServer";
import { ResumeViewClient } from "@/modules/resume/components/ResumeViewClient";
import { getResumeOnServer } from "@/modules/resume/server";
import { getProfileOnServer } from "@/modules/profile/server";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, resume, profile] = await Promise.all([
    requireCurrentUser(),
    getResumeOnServer(id),
    getProfileOnServer(),
  ]);

  return (
    <AppShell user={user} initialProfile={profile}>
      <ResumeViewClient initialResume={resume || undefined} resumeId={id} />
    </AppShell>
  );
}
