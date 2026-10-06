import { getSessionUser } from "@/modules/auth/server";
import { AppShellServer as AppShell } from "@/modules/layout/AppShellServer";
import { ResumeViewClient } from "@/modules/resume/components/ResumeViewClient";
import { getResumeOnServer } from "@/modules/resume/server";
import { getProfileOnServer } from "@/modules/profile/server";
import { redirect } from "next/navigation";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/auth/login");
  const isGuest = Boolean(sessionUser.is_guest);
  const [resume, profile] = await Promise.all([
    getResumeOnServer(id),
    isGuest ? Promise.resolve(null) : getProfileOnServer(),
  ]);

  return (
    <AppShell user={isGuest ? null : sessionUser} initialProfile={profile}>
      <ResumeViewClient
        initialResume={resume || undefined}
        resumeId={id}
        isRegistered={!isGuest}
        isGuest={isGuest}
      />
    </AppShell>
  );
}
