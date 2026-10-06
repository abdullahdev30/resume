"use client";

import { Download, Pencil, Save, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { ResumeDocument } from "@/components/templates/ResumeDocument";
import { ResumePrintRoot } from "@/components/templates/ResumePrintRoot";
import { ResumePreview } from "@/components/templates/ResumePreview";
import { resumeApi } from "../api";
import { downloadResumePdf } from "../downloadResumePdf";
import type { AIEditProposal, ResumeRecord } from "../types";

export function ResumeViewClient({
  initialResume,
  resumeId,
  isRegistered,
  isGuest,
}: {
  initialResume?: ResumeRecord;
  resumeId?: string;
  isRegistered: boolean;
  isGuest: boolean;
}) {
  const params = useParams<{ id: string }>();
  const activeResumeId = resumeId || params.id;
  const [resume, setResume] = useState<ResumeRecord | null>(initialResume || null);
  const [loading, setLoading] = useState(initialResume === undefined);
  const [loadError, setLoadError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [proposal, setProposal] = useState<AIEditProposal | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"proposal" | "accept" | "download" | null>(null);
  const [actionError, setActionError] = useState("");

  const loadResume = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const found = await resumeApi.get(activeResumeId);
      if (!found) throw new Error("Resume not found");
      setResume(found);
    } catch {
      setLoadError("This resume could not be loaded. It may have been removed, or you may not have access to it.");
    } finally {
      setLoading(false);
    }
  }, [activeResumeId]);

  useEffect(() => {
    if (initialResume === undefined) void loadResume();
  }, [initialResume, loadResume]);

  const requestAiEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!resume || busyAction) return;
    setBusyAction("proposal");
    setActionError("");
    try {
      setProposal(await resumeApi.aiEdit(resume.id, {
        instruction: instruction.trim(),
        job_description: jobDescription.trim() || undefined,
      }));
      toast.info("Review the proposal before applying it to your resume.", "AI proposal ready");
    } catch {
      const message = "We could not create an edit proposal. Your instructions are still available to retry.";
      setActionError(message);
      toast.error(message, "AI edit failed");
    } finally {
      setBusyAction(null);
    }
  };

  const acceptProposal = async () => {
    if (!resume || !proposal || busyAction) return;
    setBusyAction("accept");
    setActionError("");
    try {
      const updated = await resumeApi.update(resume.id, {
        resume_data: proposal.resume_data as ResumeData,
        source_version: resume.source_version,
      });
      setResume(updated);
      setProposal(null);
      setInstruction("");
      setJobDescription("");
      toast.success("The AI proposal was saved to your resume.", "Changes saved");
    } catch {
      const message = "The proposal could not be saved. It is still open so you can retry.";
      setActionError(message);
      toast.error(message, "Save failed");
    } finally {
      setBusyAction(null);
    }
  };

  const downloadResume = async () => {
    if (!resume || busyAction) return;
    setBusyAction("download");
    setActionError("");
    try {
      if (resume.editable) {
        await downloadResumePdf(resume.title);
      } else {
        const { download_url: downloadUrl } = await resumeApi.getPdf(resume.id);
        window.location.assign(downloadUrl);
      }
    } catch {
      const message = "We could not prepare this resume download. Please try again.";
      setActionError(message);
      toast.error(message, "Download failed");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) return <LoadingState label="Loading resume..." cards={1} />;
  if (loadError || !resume) return <ErrorState message={loadError || "Unable to load resume."} onRetry={() => void loadResume()} />;

  return (
    <div className="resume-print-context page-stack">
      <PageHeader
        eyebrow={resume.resume_type === "ai" ? "AI-generated resume" : resume.resume_type === "legacy_pdf" ? "Uploaded document" : "Template resume"}
        icon={resume.resume_type === "ai" ? <Sparkles size={15} aria-hidden="true" /> : undefined}
        title={resume.title}
        description={resume.editable
          ? isRegistered
            ? "Your editable source is saved to your account and printed directly from this template."
            : "This resume is saved to your private temporary guest workspace. Create an account before it expires to keep it."
          : "This uploaded PDF is available to view and download."}
        actions={
          <>
            {resume.editable && (
              <Link
                href={!isGuest
                  ? `/resumes/${resume.id}/edit`
                  : `/editor/${resume.template_id || "1"}?resumeId=${resume.id}&guest=1`}
                className="button button-secondary"
              >
                <Pencil size={16} aria-hidden="true" />
                Edit resume
              </Link>
            )}
            {(resume.editable || isRegistered) && (
              <div className="flex max-w-80 flex-col items-end gap-1">
                <Button
                  onClick={() => void downloadResume()}
                  loading={busyAction === "download"}
                  loadingLabel="Preparing..."
                  disabled={Boolean(busyAction)}
                >
                  <Download size={16} aria-hidden="true" />
                  {resume.editable ? "Print / Save PDF" : "Download PDF"}
                </Button>
                {resume.editable && <p className="text-right text-[10px] leading-tight text-[var(--text-muted)]">
                  In the print window choose <strong>Save as PDF</strong>, Margins: <strong>None</strong>, enable <strong>Background graphics</strong>.
                </p>}
              </div>
            )}
          </>
        }
      />

      {isGuest && (
        <Alert variant="warning">
          Guest work is database-backed for this temporary session. Create an account before the session expires to keep it.
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">{resume.resume_type.replace("_", " ")}</Badge>
        <Badge variant={resume.editable ? "success" : "neutral"}>{resume.editable ? "Editable" : "PDF only"}</Badge>
        <Badge variant="neutral">Updated {new Date(resume.updated_at).toLocaleDateString()}</Badge>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {resume.editable && resume.resume_data ? (
        <Card padding="none" className="overflow-hidden">
          <ResumePreview>
            <ResumeDocument
              data={resume.resume_data as ResumeData}
              elementStyles={(resume.resume_data as ResumeData).elementStyles}
              templateId={resume.template_id || "1"}
            />
          </ResumePreview>
        </Card>
      ) : (
        <Card padding="lg">
          <p className="text-sm text-[var(--text-muted)]">
            Preview and browser printing are available for editable template and AI resumes. This item is an uploaded legacy PDF.
          </p>
        </Card>
      )}

      {isRegistered && resume.editable && (
        <Card padding="lg">
          <form onSubmit={requestAiEdit} className="form-stack">
            <div>
              <div className="page-eyebrow"><Sparkles size={15} aria-hidden="true" /> AI edit</div>
              <h2 className="mt-2 text-xl font-bold">Propose a targeted revision</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Nothing changes until you review and accept the proposal.</p>
            </div>
            <Textarea
              label="Editing instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              rows={3}
              placeholder="Make this stronger for a senior backend engineer role without inventing facts."
              required
            />
            <Textarea
              label="Job description"
              optional
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={5}
              placeholder="Paste the target role for more specific suggestions."
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={busyAction === "proposal"}
                loadingLabel="Creating proposal..."
                disabled={!instruction.trim() || Boolean(busyAction)}
              >
                <Sparkles size={16} aria-hidden="true" />
                Create proposal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {proposal && (
        <Card padding="lg" className="border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="page-eyebrow">Review required</div>
              <h2 className="mt-1 text-lg font-bold">AI edit proposal</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void acceptProposal()}
                loading={busyAction === "accept"}
                loadingLabel="Saving..."
                disabled={Boolean(busyAction)}
              >
                <Save size={15} aria-hidden="true" />
                Accept and save
              </Button>
              <Button variant="secondary" onClick={() => setDiscardOpen(true)} disabled={Boolean(busyAction)}>
                <X size={15} aria-hidden="true" />
                Discard
              </Button>
            </div>
          </div>
          <div className="min-h-[620px] w-full overflow-auto rounded-xl border border-[var(--border)] bg-white">
            <ResumePreview>
              <ResumeDocument
                data={proposal.resume_data}
                elementStyles={proposal.resume_data.elementStyles}
                templateId={resume.template_id || "1"}
              />
            </ResumePreview>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={discardOpen}
        title="Discard this proposal?"
        description="The proposed changes have not been saved and will be lost."
        onClose={() => setDiscardOpen(false)}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDiscardOpen(false)}>Keep reviewing</Button>
          <Button
            variant="danger"
            onClick={() => {
              setProposal(null);
              setDiscardOpen(false);
              toast.info("The proposal was discarded.");
            }}
          >
            Discard proposal
          </Button>
        </div>
      </ConfirmDialog>
      {resume.editable && resume.resume_data && (
        <ResumePrintRoot
          data={resume.resume_data as ResumeData}
          templateId={resume.template_id || "1"}
        />
      )}
    </div>
  );
}
