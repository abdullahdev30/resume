import { requireCurrentUser } from "@/modules/auth/server";
import { AccountResumeEditor } from "@/modules/resume/components/AccountResumeEditor";
export default async function ResumeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCurrentUser();
  return <AccountResumeEditor resumeId={(await params).id} />;
}
