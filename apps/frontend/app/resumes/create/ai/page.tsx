import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer as AppShell } from "@/modules/layout/AppShellServer";
import { CreateAIResumeClient } from "@/modules/resume/components/CreateAIResumeClient";

export default async function CreateAIResumePage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <CreateAIResumeClient />
    </AppShell>
  );
}
