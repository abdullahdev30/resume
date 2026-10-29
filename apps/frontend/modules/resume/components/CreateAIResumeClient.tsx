"use client";

import { Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ApiClientError } from "@/lib/api-client";
import { resumeApi } from "../api";
import { EditorDocument } from "./AccountResumeEditor";
import type { ResumeRecord } from "../types";
import Link from "next/link";
import { useApiQuery } from "@/lib/use-api-query";
import type { Persona } from "@/modules/persona/types";
import type { AIResumePayload } from "../types";

type ProfileSection = NonNullable<AIResumePayload["selected_sections"]>[number];

const profileSections: Array<{ id: ProfileSection; label: string }> = [
  { id: "personal", label: "Contact details" },
  { id: "summary", label: "Professional summary" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "certificates", label: "Certificates" },
  { id: "languages", label: "Languages" },
  { id: "social_links", label: "Social links" },
];

const progressMessages = [
  "Reading your saved profile...",
  "Matching your experience to the role...",
  "Structuring a concise resume draft...",
  "Validating the generated sections...",
];

export function CreateAIResumeClient() {
  const [draft, setDraft] = useState<ResumeRecord | null>(null);
  const [title, setTitle] = useState("AI Generated Resume");
  const personas = useApiQuery<Persona[]>("/personas");
  const [personaId, setPersonaId] = useState("");
  const selectedPersona = personaId || personas.data?.[0]?.id || "";
  const [prompt, setPrompt] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([""]);
  const [selectedSections, setSelectedSections] = useState<ProfileSection[]>(
    profileSections.map((section) => section.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progressIndex, setProgressIndex] = useState(0);

  useEffect(() => {
    if (!saving) {
      setProgressIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setProgressIndex((current) =>
        Math.min(current + 1, progressMessages.length - 1),
      );
    }, 2500);
    return () => window.clearInterval(timer);
  }, [saving]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const resume = await resumeApi.createAI({
        title: title.trim(),
        persona_id: selectedPersona,
        prompt: prompt.trim(),
        job_description: jobDescription.trim() || undefined,
        reference_links: referenceLinks
          .map((link) => link.trim())
          .filter(Boolean),
        selected_sections: selectedSections,
      });
      setDraft({
        id: "",
        title: title.trim(),
        resume_type: "ai",
        editable: true,
        template_id: resume.template_id,
        resume_data: resume.resume_data,
        source_version: 1,
        created_at: "",
        updated_at: "",
      });
      toast.success("Review your AI draft, then save it to your account.");
    } catch (caught) {
      const message =
        caught instanceof ApiClientError
          ? `${formatAiErrorCode(caught.code)}${caught.message}`
          : "We could not generate your resume. Your instructions are still here—please try again.";
      setError(message);
      toast.error(message, "Generation failed");
    } finally {
      setSaving(false);
    }
  };

  if (draft) return <EditorDocument record={draft} />;
  return (
    <form onSubmit={submit} className="page-stack max-w-3xl">
      <PageHeader
        eyebrow="AI-assisted draft"
        icon={<Sparkles size={15} aria-hidden="true" />}
        title="Create a focused first draft"
        description="The server combines your saved profile with your instructions, validates the result, and opens an editable draft. Save it when you are ready."
      />

      {error && <Alert variant="error">{error}</Alert>}

      <Card padding="lg" className="form-stack">
        <label className="form-stack text-sm font-semibold">
          Persona
          <select
            aria-label="Persona"
            className="field-control"
            value={selectedPersona}
            onChange={(event) => setPersonaId(event.target.value)}
            required
            disabled={personas.isPending}
          >
            <option value="">Choose a persona</option>
            {personas.data?.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
        </label>
        {personas.error && (
          <Alert variant="error">
            {personas.error.message}
            <Button variant="secondary" onClick={() => void personas.refetch()}>
              Retry
            </Button>
          </Alert>
        )}
        {!personas.isPending && !personas.data?.length && (
          <Link href="/persona" className="text-link">
            Create a persona before generating your resume.
          </Link>
        )}
        <Input
          label="Resume title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
          required
          maxLength={120}
          hint="Use a title that will be easy to find in your library."
        />
        <Textarea
          label="What should this resume emphasize?"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          placeholder="For example: Create a backend engineer resume focused on FastAPI, Supabase, and cloud storage work."
          required
          maxLength={4000}
        />
        <Textarea
          label="Target job description"
          optional
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          rows={7}
          placeholder="Paste the role description to tailor the draft more closely."
          maxLength={12000}
        />

        <fieldset className="form-stack rounded-2xl border border-[var(--border)] p-4">
          <legend className="px-1 text-sm font-bold text-[var(--text)]">
            Profile sections to use
          </legend>
          <p className="text-xs text-[var(--text-muted)]">
            Your profile is read securely by the server. Unselected sections are
            not sent to the AI provider.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {profileSections.map((section) => (
              <label
                key={section.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section.id)}
                  onChange={(event) =>
                    setSelectedSections((current) =>
                      event.target.checked
                        ? [...current, section.id]
                        : current.filter((id) => id !== section.id),
                    )
                  }
                />
                {section.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-stack rounded-2xl border border-[var(--border)] p-4">
          <legend className="px-1 text-sm font-bold text-[var(--text)]">
            Reference links{" "}
            <span className="font-normal text-[var(--text-muted)]">
              (optional)
            </span>
          </legend>
          <p className="text-xs text-[var(--text-muted)]">
            Add public portfolio, job, or project URLs for the server to read
            safely. Only public HTTP and HTTPS pages are accepted.
          </p>
          {referenceLinks.map((link, index) => (
            <div key={index} className="flex items-end gap-2">
              <Input
                label={`Reference ${index + 1}`}
                type="url"
                value={link}
                onChange={(event) =>
                  setReferenceLinks((current) =>
                    current.map((value, itemIndex) =>
                      itemIndex === index ? event.target.value : value,
                    ),
                  )
                }
                placeholder="https://example.com/portfolio"
              />
              {referenceLinks.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setReferenceLinks((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {referenceLinks.length < 5 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReferenceLinks((current) => [...current, ""])}
            >
              Add reference
            </Button>
          )}
        </fieldset>
      </Card>

      {saving && (
        <Alert variant="info" role="status">
          {progressMessages[progressIndex]} This can take up to a minute.
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          loading={saving}
          loadingLabel="Generating..."
          disabled={
            !selectedPersona ||
            !title.trim() ||
            !prompt.trim() ||
            selectedSections.length === 0
          }
        >
          <Sparkles size={17} aria-hidden="true" />
          Generate resume
        </Button>
      </div>
    </form>
  );
}

function formatAiErrorCode(code?: string) {
  return code ? `[${code}] ` : "";
}
