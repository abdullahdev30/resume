"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const profile = await profileApi.getProfile();
      const resume = await resumeApi.createAI({
        title: title.trim(),
        prompt: prompt.trim(),
        job_description: jobDescription.trim() || undefined,
        profile_context: { ...profile } as Record<string, unknown>,
      });
      toast.success("Your AI draft is ready to review.", "Resume created");
      router.push(`/resumes/${resume.id}/edit`);
    } catch {
      const message = "We could not generate your resume. Your instructions are still here—please try again.";
      setError(message);
      toast.error(message, "Generation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="page-stack max-w-3xl">
      <PageHeader
        eyebrow="AI-assisted draft"
        icon={<Sparkles size={15} aria-hidden="true" />}
        title="Create a focused first draft"
        description="We will combine your saved profile with your instructions. Nothing is saved until the backend confirms the new resume."
      />

      {error && <Alert variant="error">{error}</Alert>}

      <Card padding="lg" className="form-stack">
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
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          loading={saving}
          loadingLabel="Generating..."
          disabled={!title.trim() || !prompt.trim()}
        >
          <Sparkles size={17} aria-hidden="true" />
          Generate resume
        </Button>
      </div>
    </form>
  );
}
