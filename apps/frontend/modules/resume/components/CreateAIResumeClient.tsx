"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";

import { profileApi } from "@/modules/profile/api";
import { resumeApi } from "../api";

export function CreateAIResumeClient() {
  const router = useRouter();
  const [title, setTitle] = useState("AI Generated Resume");
  const [prompt, setPrompt] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let profileContext: Record<string, unknown> = {};
      try {
        profileContext = { ...(await profileApi.getProfile()) } as Record<string, unknown>;
      } catch {
        profileContext = {};
      }
      const resume = await resumeApi.createAI({
        title,
        prompt,
        job_description: jobDescription || undefined,
        profile_context: profileContext,
      });
      router.push(`/resumes/${resume.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create AI resume.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text)] flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[var(--primary)]" />
          AI Generated Resume
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          The backend uses your profile data and instructions, then saves editable source plus a PDF.
        </p>
      </div>

      {error && <div className="rounded-xl bg-rose-50 text-rose-700 px-4 py-3 text-sm font-semibold">{error}</div>}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Resume Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Instruction</label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Example: Create a backend engineer resume focused on FastAPI, Supabase, and cloud storage work."
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={6}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="Optional target job description"
          />
        </div>
      </div>

      <button
        disabled={saving}
        className="bg-[var(--primary)] text-[var(--on-primary)] rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
      >
        {saving ? "Generating..." : "Generate Resume"}
      </button>
    </form>
  );
}
