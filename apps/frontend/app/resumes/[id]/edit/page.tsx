import { requireCurrentUser } from "@/modules/auth/server";
import { AppShell } from "@/modules/layout/AppShell";
import { ResumeEditRedirect } from "@/modules/resume/components/ResumeEditRedirect";

export default async function EditResumePage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <ResumeEditRedirect />
    </AppShell>
  );
}
