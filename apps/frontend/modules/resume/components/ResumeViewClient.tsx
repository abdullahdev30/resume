"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Download, Pencil, Save, Sparkles, X } from "lucide-react";

import type { ResumeData } from "@/components/templates/TemplateOne";
import { resumeApi } from "../api";
import type { AIEditProposal, ResumeRecord } from "../types";

export function ResumeViewClient() {
  const params = useParams<{ id: string }>();
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [instruction, setInstruction] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [proposal, setProposal] = useState<AIEditProposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    resumeApi.get(params.id).then(setResume).catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to load resume.");
    });
  }, [params.id]);

  const requestAiEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!resume) return;
    setBusy(true);
    setError("");
    try {
      setProposal(
        await resumeApi.aiEdit(resume.id, {
          instruction,
          job_description: jobDescription || undefined,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create AI edit.");
    } finally {
      setBusy(false);
    }
  };

  const acceptProposal = async () => {
    if (!resume || !proposal) return;
    setBusy(true);
    try {
      const updated = await resumeApi.update(resume.id, {
        resume_data: proposal.resume_data as ResumeData,
        html_content: proposal.html_content,
      });
      setResume(updated);
      setProposal(null);
      setInstruction("");
      setJobDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save AI edit.");
    } finally {
      setBusy(false);
    }
  };

  if (!resume) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-muted)]">
        {error || "Loading resume..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">{resume.title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {resume.resume_type.replace("_", " ")} · {resume.editable ? "Editable source saved" : "PDF only"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {resume.editable && (
            <Link
              href={`/resumes/${resume.id}/edit`}
              className="bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-sm font-bold inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          )}
          <a
            href={resume.download_url}
            target="_blank"
            rel="noreferrer"
            className="bg-[var(--primary)] text-[var(--on-primary)] rounded-xl px-4 py-2 text-sm font-bold inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        </div>
      </div>

      {error && <div className="rounded-xl bg-rose-50 text-rose-700 px-4 py-3 text-sm font-semibold">{error}</div>}

      {resume.html_content ? (
        <iframe
          title={resume.title}
          sandbox=""
          srcDoc={resume.html_content}
          className="w-full min-h-[780px] rounded-xl border border-[var(--border)] bg-white"
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
          This resume was uploaded as a PDF and can be downloaded, renamed, or deleted from My Resumes.
        </div>
      )}

      {resume.editable && (
        <form onSubmit={requestAiEdit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <h2 className="font-extrabold text-[var(--text)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            AI Edit
          </h2>
          <textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Example: Make this stronger for a senior backend engineer role without inventing facts."
            required
          />
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Optional job description"
          />
          <button disabled={busy} className="bg-[var(--primary)] text-[var(--on-primary)] rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60">
            {busy ? "Working..." : "Create AI Proposal"}
          </button>
        </form>
      )}

      {proposal && (
        <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--surface)] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold text-[var(--text)]">AI Proposal</h2>
            <div className="flex gap-2">
              <button onClick={acceptProposal} className="bg-[var(--primary)] text-[var(--on-primary)] rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                Accept
              </button>
              <button onClick={() => setProposal(null)} className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                Discard
              </button>
            </div>
          </div>
          <iframe
            title="AI proposal"
            sandbox=""
            srcDoc={proposal.html_content}
            className="w-full min-h-[620px] rounded-xl border border-[var(--border)] bg-white"
          />
        </div>
      )}
    </div>
  );
}
