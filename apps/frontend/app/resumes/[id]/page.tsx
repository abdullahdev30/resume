import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { ResumeViewClient } from "@/modules/resume/components/ResumeViewClient";
export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  return (
    <AppShellServer user={user}>
      <ResumeViewClient resumeId={(await params).id} />
    </AppShellServer>
  );
}
