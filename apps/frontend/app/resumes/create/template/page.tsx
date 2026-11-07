import { requireSubscribedUser } from "@/modules/billing/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { AccountTemplatePicker } from "@/modules/resume/components/AccountTemplatePicker";

export default async function CreateTemplateResumePage({
  searchParams,
}: {
  searchParams: Promise<{ personaId?: string; templateId?: string }>;
}) {
  const user = await requireSubscribedUser();
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
