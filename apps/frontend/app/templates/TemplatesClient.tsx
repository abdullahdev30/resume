"use client";
import { LayoutTemplate, Search, ArrowLeft, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import styles from "./TemplatesClient.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  templateCatalog,
  type TemplateItem,
} from "@/components/templates/catalog";
import {
  TemplateCard,
  renderTemplate,
} from "@/components/templates/TemplateCard";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useFreeResume } from "@/modules/resume/store";
import { useApiQuery } from "@/lib/use-api-query";
import type { ResumeListResponse, ResumeRecord } from "@/modules/resume/types";
import { resumeApi } from "@/modules/resume/api";
import { ResumeThumbnail } from "@/modules/resume/components/ResumeThumbnail";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { templateHtml } from "@/modules/resume/templateHtml";
import type { Membership } from "@/modules/billing/types";
export default function TemplatesClient({
  onSelect,
}: {
  onSelect?: (template: TemplateItem) => void;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [changeOpen, setChangeOpen] = useState(false);
  const [resumeChoice, setResumeChoice] = useState<ResumeRecord | "free" | null>(null);
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState("");
  const accountResumes = useApiQuery<ResumeListResponse>("/resumes", { enabled: changeOpen });
  const membership = useApiQuery<Membership>("/billing/me", { enabled: !onSelect });
  const canChangeSavedResume = !onSelect && Boolean(
    membership.data &&
      (membership.data.role !== "user" ||
        (membership.data.status === "active" &&
          Number(membership.data.subscription?.monthly_price || 0) > 0)),
  );
  const freeResume = useFreeResume();
  useEffect(() => { void useFreeResume.persist.rehydrate(); }, []);
  const select = (item: TemplateItem) => {
    if (onSelect) {
      onSelect(item);
      return;
    }
    useFreeResume.getState().start(item.id);
    router.push(`/editor/${item.id}`);
  };
  const chooseReplacement = async (item: TemplateItem) => {
    if (!resumeChoice || changing) return;
    setChanging(true);
    setChangeError("");
    try {
      if (resumeChoice === "free") {
        useFreeResume.getState().update({ templateId: item.id });
        router.push(`/editor/${item.id}`);
      } else {
        const data = resumeChoice.resume_data as ResumeData;
        const html_content = await templateHtml(data, item.id);
        await resumeApi.update(resumeChoice.id, {
          template_id: item.id,
          resume_data: data,
          html_content,
          source_version: resumeChoice.source_version,
        });
        router.push(`/editor/${item.id}?resumeId=${encodeURIComponent(resumeChoice.id)}`);
      }
      setChangeOpen(false);
      setResumeChoice(null);
    } catch (caught) {
      setChangeError(caught instanceof Error ? caught.message : "Could not change this resume template.");
    } finally {
      setChanging(false);
    }
  };
  const categories = [
    "All",
    ...new Set(templateCatalog.map((item) => item.category)),
  ];
  const filtered = templateCatalog.filter(
    (item) =>
      (filter === "All" || item.category === filter) &&
      `${item.name} ${item.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Find your starting point"
        icon={<LayoutTemplate size={16} aria-hidden="true" />}
        title="Create your resume"
        description="Choose a template to get started. You can customize everything in the editor."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {canChangeSavedResume && <Button variant="secondary" onClick={() => { setChangeOpen(true); setResumeChoice(null); setChangeError(""); }}>Change a resume template</Button>}
            <span className={styles.count}>{templateCatalog.length} templates</span>
          </div>
        }
      />
      <div className={styles.controls}>
        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search templates</span>
          <input
            type="search"
            placeholder="Search by name or style?"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div
          className={styles.filters}
          role="group"
          aria-label="Template categories"
        >
          {categories.map((category) => (
            <button
              type="button"
              className={styles.filter}
              aria-pressed={filter === category}
              key={category}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.results} aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "template" : "templates"}
        {filter !== "All" ? ` ? ${filter}` : " to make your own"}
      </div>
      <section className="template-gallery-grid" aria-label="Resume templates">
        {filtered.map((item) => (
          <TemplateCard
            key={item.id}
            item={item}
            onSelect={select}
            onPreview={setPreview}
          />
        ))}
      </section>
      {!filtered.length && (
        <div className={styles.empty}>
          <Search size={24} aria-hidden="true" />
          <h2>No templates found</h2>
          <p>Try another search or explore all templates.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch("");
              setFilter("All");
            }}
          >
            Reset filters
          </Button>
        </div>
      )}
      <Dialog
        open={Boolean(preview)}
        title={preview?.name || "Template preview"}
        onClose={() => setPreview(null)}
        className="max-w-4xl"
      >
        <div className="overflow-auto">
          {preview && renderTemplate(preview)}
        </div>
        {preview && (
          <Button onClick={() => select(preview)}>Use this template</Button>
        )}
      </Dialog>
      <Dialog
        open={changeOpen}
        title={resumeChoice ? "Choose a replacement template" : "Choose a resume to update"}
        description={resumeChoice ? "Your saved resume details will be retained in the new template." : "Select one of your saved resumes or your current free draft."}
        onClose={() => { if (!changing) { setChangeOpen(false); setResumeChoice(null); } }}
        preventClose={changing}
        className="max-w-6xl"
      >
        {changeError && <p className="mb-4 text-sm text-[var(--danger,#b42318)]" role="alert">{changeError}</p>}
        {resumeChoice ? <>
          <Button variant="ghost" onClick={() => setResumeChoice(null)} disabled={changing}><ArrowLeft size={16} /> Back to resumes</Button>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templateCatalog.map((item) => <article key={item.id} className="rounded-lg border border-[var(--border)] p-3">
              <div className="max-h-64 overflow-hidden rounded border border-[var(--border)]"><ResumeThumbnail data={item.data} templateId={item.id} /></div>
              <h3 className="mt-3 font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
              <Button className="mt-3 w-full" onClick={() => void chooseReplacement(item)} disabled={changing} loading={changing}>{changing ? "Applying..." : "Use this template"}</Button>
            </article>)}
          </div>
        </> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {freeResume.exists && <button type="button" onClick={() => setResumeChoice("free")} className="rounded-lg border border-[var(--border)] p-3 text-left hover:border-[var(--primary)]">
            <div className="max-h-64 overflow-hidden rounded border border-[var(--border)]"><ResumeThumbnail data={freeResume.data as unknown as ResumeData} templateId={freeResume.templateId} /></div>
            <strong className="mt-3 block">{freeResume.title} · Free draft</strong>
          </button>}
          {accountResumes.data?.resumes.filter((resume) => resume.editable && resume.resume_data).map((resume) => <button type="button" key={resume.id} onClick={() => setResumeChoice(resume)} className="rounded-lg border border-[var(--border)] p-3 text-left hover:border-[var(--primary)]">
            <div className="max-h-64 overflow-hidden rounded border border-[var(--border)]"><ResumeThumbnail data={resume.resume_data as ResumeData} templateId={resume.template_id || "1"} /></div>
            <strong className="mt-3 block">{resume.title}</strong>
          </button>)}
          {accountResumes.isPending && <p className="text-sm text-[var(--text-muted)]">Loading saved resumes…</p>}
          {accountResumes.error && !freeResume.exists && <p className="text-sm text-[var(--text-muted)]">No saved account resumes found. Start a free resume from the templates page.</p>}
          {!accountResumes.isPending && !accountResumes.error && !accountResumes.data?.resumes.length && !freeResume.exists && <div className="rounded border border-dashed border-[var(--border)] p-6 text-center"><FileText className="mx-auto mb-2" /><p>No editable resumes yet. Create one first, then you can change its template here.</p></div>}
        </div>}
      </Dialog>
    </div>
  );
}
