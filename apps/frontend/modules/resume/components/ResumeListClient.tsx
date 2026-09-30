"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, FileText, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

import { resumeApi } from "../api";
import type { ResumeRecord } from "../types";

export function ResumeListClient() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void loadResumes();
  }, []);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const response = await resumeApi.list();
      setResumes(response.resumes);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id: string) => {
    await resumeApi.remove(id);
    setResumes((current) => current.filter((resume) => resume.id !== id));
    setNotice("Resume deleted.");
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">My Resumes</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Open, edit, AI-edit, download, rename, and delete your saved resumes.
          </p>
        </div>
        <Link
          href="/resumes/create"
          className="bg-[var(--primary)] text-[var(--on-primary)] px-4 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Resume
        </Link>
      </div>

      {notice && (
        <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-tint)] px-4 py-3 text-sm font-semibold text-[var(--primary)]">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-muted)]">
          Loading resumes...
        </div>
      ) : resumes.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <FileText className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />
          <h2 className="font-bold text-[var(--text)]">No resumes yet</h2>
          <Link href="/resumes/create" className="text-sm font-bold text-[var(--primary)] mt-2 inline-block">
            Create your first resume
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {resumes.map((resume) => (
            <article
              key={resume.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--primary)]" />
                    <h2 className="font-extrabold text-[var(--text)]">{resume.title}</h2>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {resume.resume_type.replace("_", " ")} · {resume.editable ? "Editable" : "PDF only"}
                  </p>
                </div>
                {resume.resume_type === "ai" && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/resumes/${resume.id}`}
                  className="px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs font-bold"
                >
                  Open
                </Link>
                {resume.editable && (
                  <Link
                    href={`/resumes/${resume.id}/edit`}
                    className="px-3 py-2 rounded-lg bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                )}
                <a
                  href={resume.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </a>
                <button
                  onClick={() => deleteResume(resume.id)}
                  className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
