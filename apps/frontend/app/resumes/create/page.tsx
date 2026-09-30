import Link from "next/link";
import { LayoutTemplate, Sparkles } from "lucide-react";

import { requireCurrentUser } from "@/modules/auth/server";
import { AppShell } from "@/modules/layout/AppShell";

export default async function CreateResumePage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Create Resume</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Start from a designed template or generate a first draft with AI from your profile details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/templates"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--primary)] transition"
          >
            <LayoutTemplate className="w-8 h-8 text-[var(--primary)] mb-4" />
            <h2 className="font-extrabold text-[var(--text)]">Template Resume</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Choose a template, edit live, save editable source, and download the generated PDF.
            </p>
          </Link>

          <Link
            href="/resumes/create/ai"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--primary)] transition"
          >
            <Sparkles className="w-8 h-8 text-[var(--primary)] mb-4" />
            <h2 className="font-extrabold text-[var(--text)]">AI Generated Resume</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Provide a role or job description and generate an editable resume draft.
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
