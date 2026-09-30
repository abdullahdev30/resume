import { requireCurrentUser } from "@/modules/auth/server";
import { AppShell } from "@/modules/layout/AppShell";
import { CreateAIResumeClient } from "@/modules/resume/components/CreateAIResumeClient";

export default async function CreateAIResumePage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <CreateAIResumeClient />
    </AppShell>
  );
}
