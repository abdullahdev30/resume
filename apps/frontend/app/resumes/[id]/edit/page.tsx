import { requireCurrentUser } from "@/modules/auth/server";
import { getResumeOnServer } from "@/modules/resume/server";
import { notFound, redirect } from "next/navigation";

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [, resume] = await Promise.all([requireCurrentUser(), getResumeOnServer(id)]);

  if (!resume) notFound();
  if (!resume.editable) redirect(`/resumes/${resume.id}`);
  redirect(`/editor/${resume.template_id || "1"}?resumeId=${resume.id}`);
}
