import { getCurrentUser } from "@/modules/auth/server";
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
  const user = await getCurrentUser();
  if (!user && !id.startsWith("guest-")) redirect("/auth/login");
  const [resume, profile] = user
    ? await Promise.all([getResumeOnServer(id), getProfileOnServer()])
    : [null, null];

  return (
    <AppShell user={user} initialProfile={profile}>
      <ResumeViewClient
        initialResume={resume || undefined}
        resumeId={id}
        isAuthenticated={Boolean(user)}
      />
    </AppShell>
  );
}
