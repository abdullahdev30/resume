"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useApiQuery } from "@/lib/use-api-query";
import { templateCatalog } from "@/components/templates/catalog";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { blankResume, normalizeResume } from "../editorDocument";
import { useRecentlyOpened, markResumeOpened } from "../recentResumes";
import type { ResumeRecord, ResumeListResponse } from "../types";
import { ResumeThumbnail } from "./ResumeThumbnail";
import styles from "./ResumeGallery.module.css";

function ResumeTile({ resume }: { resume: ResumeRecord }) {
  const host = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const source = useApiQuery<ResumeRecord>(`/resumes/${resume.id}`, {
    enabled: visible && !resume.resume_data && resume.editable,
  });
  const template =
    templateCatalog.find((item) => item.id === resume.template_id) ||
    templateCatalog[0]!;
  const data = source.data?.resume_data || resume.resume_data;
  return (
    <Link
      ref={host}
      prefetch={false}
      title={resume.title}
      className={styles.tile}
      href={
        resume.editable
          ? `/editor/${template.id}?resumeId=${resume.id}`
          : `/resumes/${resume.id}`
      }
      aria-label={`Open ${resume.title}`}
      onClick={() => markResumeOpened(resume.id)}
    >
      {resume.editable ? (
        <ResumeThumbnail
          templateId={template.id}
          data={
            data ? normalizeResume(data as ResumeData) : blankResume(template)
          }
        />
      ) : (
        <div className={styles.pdfSheet} aria-hidden="true">
          PDF
        </div>
      )}
      <span className={styles.name}>{resume.title}</span>
    </Link>
  );
}

export function ResumeListClient({
  dashboard = false,
  initialResumes,
}: {
  dashboard?: boolean;
  initialResumes?: ResumeRecord[];
}) {
  const query = useApiQuery<ResumeListResponse>("/resumes", {
    initialData: initialResumes ? { resumes: initialResumes } : undefined,
  });
  const [search, setSearch] = useState("");
  const opened = useRecentlyOpened();
  const resumes = (query.data?.resumes || []).filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );
  const recent = resumes
    .filter((item) => opened[item.id])
    .sort((a, b) => opened[b.id]! - opened[a.id]!)
    .slice(0, 12);
  const shown = dashboard ? recent : resumes;
  return (
    <div className={styles.workspace}>
      <PageHeader
        eyebrow={dashboard ? "Your workspace" : "Your documents"}
        title={dashboard ? "Home" : "My Resumes"}
        description={
          dashboard
            ? "Choose a design or pick up where you left off."
            : "Select a resume to continue editing."
        }
        actions={
          <Link className="button button-primary" href="/resumes/create">
            New resume
          </Link>
        }
      />
      {dashboard && (
        <section
          className={styles.templates}
          aria-labelledby="trending-templates-title"
        >
          <div className={styles.sectionHeading}>
            <h2 id="trending-templates-title">Trending templates</h2>
            <Link href="/resumes/create/template">All templates</Link>
          </div>
          <div className={styles.trendingGrid}>
            {templateCatalog.map((template) => (
              <Link
                className={styles.tile}
                prefetch={false}
                href={`/resumes/create/template?templateId=${template.id}`}
                key={template.id}
                aria-label={`Use ${template.name}`}
              >
                <ResumeThumbnail
                  data={template.data}
                  templateId={template.id}
                />
                <span className={styles.name}>{template.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section
        className={dashboard ? styles.recent : styles.library}
        aria-labelledby="resume-gallery-title"
      >
        <div className={styles.sectionHeading}>
          <h2 id="resume-gallery-title">
            {dashboard ? "Recently opened resumes" : "Your resumes"}
          </h2>
          {dashboard ? (
            <Link href="/resumes">View all resumes</Link>
          ) : (
            <label className={styles.search}>
              Search resumes
              <input
                className="field-control"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          )}
        </div>
        {query.isPending ? (
          <LoadingState label="Loading resumes..." />
        ) : query.error && !query.data ? (
          <ErrorState
            message={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : shown.length ? (
          <div
            className={`${styles.resumeGrid} ${dashboard ? styles.twoRows : ""}`}
          >
            {shown.map((resume) => (
              <ResumeTile key={resume.id} resume={resume} />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            {dashboard
              ? "Open a resume from My Resumes to see it here."
              : search
                ? "No resumes match your search."
                : "No resumes yet. Choose New resume to get started."}
          </p>
        )}
      </section>
    </div>
  );
}
