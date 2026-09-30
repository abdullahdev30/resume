import { ArrowRight, LayoutTemplate, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer as AppShell } from "@/modules/layout/AppShellServer";

const options = [
  {
    href: "/templates",
    title: "Start with a template",
    description: "Choose a polished layout, autofill it from your profile, then adjust every detail in the editor.",
    icon: LayoutTemplate,
    meta: "Best for full control",
  },
  {
    href: "/resumes/create/ai",
    title: "Create with AI",
    description: "Use your saved profile and a target role to generate a focused first draft you can review and edit.",
    icon: Sparkles,
    meta: "Best for a quick draft",
  },
];

export default async function CreateResumePage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <div className="page-stack max-w-4xl">
        <PageHeader
          eyebrow="New document"
          icon={<Plus size={15} aria-hidden="true" />}
          title="How would you like to begin?"
          description="Both options create a real resume in your account and take you to the same fully editable workspace."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.href} href={option.href} className="group no-underline">
                <Card padding="lg" interactive className="flex h-full min-h-64 flex-col">
                  <div className="state-icon !h-12 !w-12"><Icon size={23} aria-hidden="true" /></div>
                  <div className="mt-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">{option.meta}</div>
                    <h2 className="mt-2 text-xl font-bold text-[var(--text)]">{option.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{option.description}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[var(--primary)]">
                    Continue <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
