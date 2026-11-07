import { notFound } from "next/navigation";
import { templateCatalog } from "@/components/templates/catalog";
import { AccountResumeEditor } from "@/modules/resume/components/AccountResumeEditor";
import { FreeResumeEditor } from "@/modules/resume/components/FreeResumeEditor";
import { requireSubscribedUser } from "@/modules/billing/server";
export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ templateId }, query] = await Promise.all([params, searchParams]);
  if (!templateCatalog.some((item) => item.id === templateId)) notFound();
  if (typeof query.resumeId === "string") {
    await requireSubscribedUser();
    return <AccountResumeEditor resumeId={query.resumeId} />;
  }
  return <FreeResumeEditor templateId={templateId} />;
}
