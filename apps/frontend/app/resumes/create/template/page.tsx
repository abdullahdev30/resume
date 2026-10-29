import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { AccountTemplatePicker } from "@/modules/resume/components/AccountTemplatePicker";

export default async function CreateTemplateResumePage({
  searchParams,
}: {
  searchParams: Promise<{ personaId?: string; templateId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/templates");
  const { personaId, templateId } = await searchParams;
  return (
    <AppShellServer user={user}>
      <AccountTemplatePicker
        user={user}
        initialPersonaId={personaId}
        initialTemplateId={templateId}
      />
    </AppShellServer>
  );
}
