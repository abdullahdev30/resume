"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilePlus2, Users, ArrowUpRight, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { MetadataDialog } from "@/modules/persona/components/MetadataDialog";
import { createPersonaWithDetails } from "@/modules/persona/api";
import { useApiQuery } from "@/lib/use-api-query";
import type { Membership, Package } from "@/modules/billing/types";
import type { ResumeListResponse, ResumeRecord } from "@/modules/resume/types";
import type { Persona } from "@/modules/persona/types";
import { ResumeThumbnail } from "@/modules/resume/components/ResumeThumbnail";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { templateCatalog } from "@/components/templates/catalog";

export default function DashboardClient() {
  const router = useRouter();
  const membership = useApiQuery<Membership>("/billing/me");
  const resumes = useApiQuery<ResumeListResponse>("/resumes");
  const personas = useApiQuery<Persona[]>("/personas");
  const packages = useApiQuery<Package[]>("/billing/packages");
  const [creatingPersona, setCreatingPersona] = useState(false);
  const current = membership.data?.subscription;
  const resumeItems = resumes.data?.resumes || [];
  const personaCount = personas.data?.length ?? membership.data?.persona_count ?? 0;
  const personaLimit = current?.persona_limit ?? 0;
  const remaining = Math.max(personaLimit - personaCount, 0);
  const usedPercent = personaLimit ? Math.min(100, (personaCount / personaLimit) * 100) : 0;
  const maximum = packages.data?.reduce<Package | undefined>((highest, item) =>
    !highest || Number(item.monthly_price) > Number(highest.monthly_price) ? item : highest, undefined);
  const canUpgrade = membership.data?.role === "user" && (!current || current.package_id !== maximum?.id);
  const recent = [...resumeItems].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)).slice(0, 4);

  return <div className="page-stack">
    <PageHeader
      eyebrow="Workspace overview"
      title="Dashboard"
      description="Create resumes, manage your personas, and keep track of your package."
      actions={<Link href="/resumes/create" className="button button-primary"><FilePlus2 size={16} /> Create resume</Link>}
    />

    {(membership.error || resumes.error || personas.error) && <Alert variant="error">{membership.error?.message || resumes.error?.message || personas.error?.message}</Alert>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace totals">
      <MetricCard icon={<FileText size={18} />} label="Resumes created" value={resumes.data ? String(resumeItems.length) : "—"} href="/resumes" />
      <MetricCard icon={<Users size={18} />} label="Personas created" value={personas.data ? String(personaCount) : "—"} href="/persona" />
      <MetricCard icon={<Users size={18} />} label="Persona slots left" value={current ? String(remaining) : "—"} href="/packages" />
      <Card padding="md" className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Current package</p><p className="mt-2 text-lg font-semibold">{current?.package_name || "No active package"}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{current ? `${personaCount} used · ${remaining} remaining` : "Choose a package to create personas."}</p></div>
        {canUpgrade && <Link href="/packages" aria-label={current ? "Upgrade package" : "Choose package"} className="button button-secondary button-sm">{current ? "Upgrade" : "Choose"}<ArrowUpRight size={15} /></Link>}
      </Card>
    </section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]" aria-label="Dashboard details">
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-lg font-bold">Package overview</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Your plan and persona allowance.</p></div>
          {canUpgrade && <Link href="/packages" className="text-sm font-semibold text-[var(--primary)]">Compare packages <ArrowUpRight className="inline" size={14} /></Link>}
        </div>
        {current ? <div className="mt-6 grid gap-6 sm:grid-cols-[150px_1fr] sm:items-center">
          <div className="relative mx-auto grid h-36 w-36 place-items-center">
            <svg viewBox="0 0 120 120" role="img" aria-label={`${personaCount} of ${personaLimit} persona slots used`} className="h-36 w-36 -rotate-90">
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--border)" strokeWidth="12" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${usedPercent * 3.016} 302`} />
            </svg>
            <div className="pointer-events-none absolute grid h-36 w-36 place-content-center text-center"><strong className="text-2xl">{remaining}</strong><span className="text-xs text-[var(--text-muted)]">slots left</span></div>
          </div>
          <div className="space-y-4">
            <div><p className="text-sm text-[var(--text-muted)]">Package</p><p className="font-semibold">{current.package_name}</p></div>
            <div><div className="mb-2 flex justify-between text-sm"><span>Personas used</span><strong>{personaCount} / {personaLimit}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${usedPercent}%` }} /></div></div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]"><span>Resumes created: <strong className="text-[var(--text)]">{resumeItems.length}</strong></span><span>Package ends: <strong className="text-[var(--text)]">{current.expires_at ? new Date(current.expires_at).toLocaleDateString() : "—"}</strong></span></div>
          </div>
        </div> : <div className="mt-5 rounded-md border border-dashed border-[var(--border)] p-5"><p className="font-semibold">No active package</p><p className="mt-1 text-sm text-[var(--text-muted)]">Choose a package to create personas and account resumes.</p><Link href="/packages" className="button button-primary button-sm mt-4">View packages</Link></div>}
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-bold">Quick actions</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Start a new document or add a professional persona.</p>
        <div className="mt-5 grid gap-3">
          <Link href="/resumes/create" className="button button-primary justify-start"><FilePlus2 size={17} /> Create resume</Link>
          <Button variant="secondary" className="justify-start" onClick={() => setCreatingPersona(true)}><Users size={17} /> Create persona</Button>
          <Link href="/templates" className="button button-secondary justify-start"><FileText size={17} /> Browse templates</Link>
        </div>
      </Card>
    </section>

    <Card padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Recent resumes</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Your most recently updated documents.</p></div><Link href="/resumes" className="text-sm font-semibold text-[var(--primary)]">View all</Link></div>
      {resumes.isPending ? <p className="text-sm text-[var(--text-muted)]">Loading resumes...</p> : recent.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recent.map((resume) => <RecentResume key={resume.id} resume={resume} />)}</div> : <p className="rounded-md border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-muted)]">No resumes created yet. Start with a template or create an AI draft.</p>}
    </Card>

    {creatingPersona && <MetadataDialog onClose={() => setCreatingPersona(false)} onSave={async (value) => { const persona = await createPersonaWithDetails(value); router.push(`/persona/${persona.id}`); }} />}
  </div>;
}

function MetricCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return <Link href={href}><Card padding="md" className="h-full transition-colors hover:border-[var(--primary)]"><span className="text-[var(--primary)]">{icon}</span><p className="mt-3 text-sm text-[var(--text-muted)]">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></Card></Link>;
}

function RecentResume({ resume }: { resume: ResumeRecord }) {
  const template = templateCatalog.find((item) => item.id === resume.template_id) || templateCatalog[0]!;
  const data = resume.resume_data as ResumeData | null | undefined;
  return <Link href={resume.editable ? `/editor/${template.id}?resumeId=${resume.id}` : `/resumes/${resume.id}`} className="rounded-md border border-[var(--border)] p-3 hover:border-[var(--primary)]">
    {resume.editable && data ? <ResumeThumbnail data={data} templateId={template.id} /> : <div className="grid aspect-[.71] place-items-center rounded bg-[var(--surface-subtle)]">PDF</div>}
    <span className="mt-2 block truncate text-sm font-semibold">{resume.title}</span>
    <span className="mt-1 block text-xs text-[var(--text-muted)]">Updated {new Date(resume.updated_at).toLocaleDateString()}</span>
  </Link>;
}
