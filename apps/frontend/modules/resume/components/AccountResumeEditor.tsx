"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileDown, Save } from "lucide-react";
import { ResumeEditor } from "./ResumeEditor";
import { templateCatalog } from "@/components/templates/catalog";
import { ResumeDocument } from "@/components/templates/ResumeDocument";
import { ResumePreview } from "@/components/templates/ResumePreview";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useApiQuery } from "@/lib/use-api-query";
import type { EditorResumeData } from "../types";
import { normalizeResume } from "../editorDocument";
import { resumeApi } from "../api";
import { downloadStoredPdf } from "../downloadStoredPdf";
import type { AIEditProposal, ResumeRecord } from "../types";
import { AIPromptBar } from "./AIPromptBar";
import { markResumeOpened } from "../recentResumes";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { getResumeLanguagePreference, setResumeLanguagePreference } from "@/lib/resume-language-preference";

export function AccountResumeEditor({ resumeId }: { resumeId?: string }) {
  const queryParams = useSearchParams();
  const id = resumeId || queryParams.get("resumeId");
  const query = useApiQuery<ResumeRecord>(`/resumes/${id}`, {
    enabled: Boolean(id),
  });
  if (!query.data && query.error)
    return (
      <ErrorState
        title="Resume unavailable"
        message={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  if (!query.data) return <LoadingState label="Opening your saved resume…" />;
  if (!query.data.editable || !query.data.resume_data)
    return (
      <ErrorState
        title="This PDF needs an editable copy"
        message="Open the resume details to create an editable AI copy."
      />
    );
  return <EditorDocument key={query.data.id} record={query.data} />;
}

export function EditorDocument({ record }: { record: ResumeRecord }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (record.id) markResumeOpened(record.id);
  }, [record.id]);
  const [templateId, setTemplateId] = useState(record.template_id || "1");
  const template = (templateCatalog.find((item) => item.id === templateId) ||
    templateCatalog[0])!;
  const [zoom, setZoom] = useState(100);
  const savedId = useRef(record.id);
  const savedRecord = useRef(record);
  const [document, setDocument] = useState(() =>
    normalizeResume(record.resume_data as ResumeData),
  );
  const [title, setTitle] = useState(record.title);
  const [revision, setRevision] = useState(0);
  const latestRevision = useRef(0);
  const savedRevision = useRef(0);
  const sourceVersion = useRef(record.source_version);
  const [saving, setSaving] = useState(false);
  const pendingSave = useRef<Promise<ResumeRecord> | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [resumeLanguage, setResumeLanguage] = useState<LanguageCode>("en");
  useEffect(() => setResumeLanguage(getResumeLanguagePreference()), []);
  const [jobDescription, setJobDescription] = useState("");
  const [references, setReferences] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const closeOptions = useCallback(() => setOptionsOpen(false), []);
  const [proposal, setProposal] = useState<AIEditProposal | null>(null);
  const proposalRevision = useRef(0);
  const [undo, setUndo] = useState<{
    document: EditorResumeData;
  } | null>(null);
  const change = () => {
    latestRevision.current += 1;
    setRevision(latestRevision.current);
  };
  const updateDocument = (next: SetStateAction<EditorResumeData>) => {
    setDocument(next);
    change();
  };
  const save = async (): Promise<ResumeRecord> => {
    if (pendingSave.current) return pendingSave.current;
    if (savedId.current && savedRevision.current === latestRevision.current)
      return savedRecord.current;
    const savingRevision = latestRevision.current;
    if (!title.trim()) {
      setError("Enter a resume title before saving.");
      throw new Error("Enter a resume title before saving.");
    }
    const data = document;
    setSaving(true);
    setError("");
    const task = (async () => {
      const { templateHtml } = await import("../templateHtml");
      const payload = {
        title: title.trim(),
        template_id: template.id,
        resume_data: data,
        html_content: await templateHtml(data, template.id),
      };
      const saved = savedId.current
        ? await resumeApi.update(savedId.current, {
            ...payload,
            source_version: sourceVersion.current,
          })
        : await resumeApi.createTemplate({
            ...payload,
            resume_type: record.resume_type === "ai" ? "ai" : "template",
          });
      markResumeOpened(saved.id);
      savedId.current = saved.id;
      savedRecord.current = saved;
      if (saved.pdf_error) setError(saved.pdf_error);
      window.history.replaceState(
        null,
        "",
        `/editor/${template.id}?resumeId=${saved.id}`,
      );
      sourceVersion.current = saved.source_version;
      savedRevision.current = savingRevision;
      return saved;
    })();
    pendingSave.current = task;
    try {
      return await task;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your changes could not be saved. Please try again.",
      );
      throw caught;
    } finally {
      pendingSave.current = null;
      setSaving(false);
    }
  };
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (!revision || !savedId.current || confirmDelete) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await pendingSave.current;
          await saveRef.current();
        } catch {
          /* Keep the document and show the save error. */
        }
      })();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [revision, confirmDelete]);

  useEffect(() => {
    if (savedId.current && revision <= savedRevision.current) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [revision, saving]);

  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await pendingSave.current;
      await saveRef.current();
      if (savedRevision.current !== latestRevision.current)
        throw new Error(
          "Your resume changed while saving. Download again when saving finishes.",
        );
      await downloadStoredPdf(savedId.current);
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "The PDF could not be downloaded.",
      );
    } finally {
      setDownloading(false);
    }
  };
  const requestProposal = async (
    requestedInstruction = instruction.trim(),
    requestedLanguage = resumeLanguage,
  ) => {
    if (aiBusy || !requestedInstruction) return;
    setAiBusy(true);
    setAiError("");
    try {
      await pendingSave.current;
      await saveRef.current();
      if (savedRevision.current !== latestRevision.current)
        throw new Error(
          "Your resume changed while saving. Send your prompt again for the latest version.",
        );
      const requestedRevision = latestRevision.current;
      const result = await resumeApi.aiEdit(savedId.current, {
        instruction: requestedInstruction,
        language: requestedLanguage,
        job_description: jobDescription.trim() || undefined,
        reference_links: references
          .split(/\r?\n/)
          .map((link) => link.trim())
          .filter(Boolean),
      });
      proposalRevision.current = requestedRevision;
      setProposal(result);
      setOptionsOpen(true);
    } catch (caught) {
      setAiError(
        caught instanceof Error
          ? caught.message
          : "AI could not create a proposal. Your prompt is still here.",
      );
    } finally {
      setAiBusy(false);
    }
  };
  const applyProposal = () => {
    if (!proposal) return;
    if (proposalRevision.current !== latestRevision.current) {
      setAiError(
        "Your resume changed while AI was working. Request a new proposal for the latest version.",
      );
      return;
    }
    setUndo({ document });
    updateDocument(normalizeResume(proposal.resume_data));
    setProposal(null);
    setOptionsOpen(false);
  };
  return (
    <>
      <ResumeEditor
        template={template}
        resumeLanguage={resumeLanguage}
        onResumeLanguageChange={(value) => {
          setResumeLanguage(value);
          setResumeLanguagePreference(value);
          if (value !== resumeLanguage) {
            const languageName = LANGUAGES.find((item) => item.code === value)?.name || "the selected language";
            void requestProposal(
              `Translate all user-facing text in this resume into ${languageName}. Preserve all factual details, names, numbers, dates, email addresses, URLs, and meaning. Do not add or remove facts. Return the complete translated resume.`,
              value,
            );
          }
        }}
        resume={document}
        onChange={updateDocument}
        title={title}
        onTitleChange={(value) => {
          setTitle(value);
          change();
        }}
        onNavigate={() =>
          (savedId.current &&
            latestRevision.current === savedRevision.current) ||
          window.confirm(
            "Your resume has unsaved changes. Leave without saving?",
          )
        }
        authenticated
        onTemplateChange={(nextTemplate) => {
          setTemplateId(nextTemplate.id);
          change();
        }}
        zoom={zoom}
        onZoomChange={setZoom}
        headerActions={
          <>
            <Button
              variant="ghost"
              disabled={!savedId.current || saving || downloading}
              onClick={() => setConfirmDelete(true)}
            >
              Delete resume
            </Button>
            <span role="status" className="text-xs text-[var(--text-muted)]">
              {saving
                ? "Saving…"
                : !savedId.current || revision > savedRevision.current
                  ? "Unsaved changes"
                  : "Saved"}
            </span>
            <Button
              variant="secondary"
              onClick={() => void save().catch(() => undefined)}
              loading={saving}
              loadingLabel="Saving…"
            >
              <Save size={16} />
              Save
            </Button>
            <Button
              onClick={() => void download()}
              loading={downloading}
              loadingLabel="Preparing PDF…"
            >
              <FileDown size={16} />
              Download PDF
            </Button>
          </>
        }
        assistant={
          <>
            <AIPromptBar
              instruction={instruction}
              onChange={setInstruction}
              onSubmit={() => void requestProposal()}
              onOptions={() => setOptionsOpen(true)}
              busy={aiBusy}
              disabled={false}
              error={aiError}
              proposalReady={Boolean(proposal)}
              language={resumeLanguage}
            />
            {error && (
              <div className="px-4 pb-2">
                <Alert variant="error">{error}</Alert>
              </div>
            )}
          </>
        }
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete resume?"
        description="This removes the resume and its PDF. Your persona and template are kept."
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
      >
        <Button
          variant="secondary"
          disabled={deleting}
          onClick={() => setConfirmDelete(false)}
        >
          Cancel
        </Button>
        <Button
          loading={deleting}
          onClick={() =>
            void (async () => {
              setDeleting(true);
              try {
                await pendingSave.current;
                await resumeApi.remove(savedId.current);
                latestRevision.current = savedRevision.current;
                router.push("/resumes");
              } catch (caught) {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "Delete failed. Please retry.",
                );
                setConfirmDelete(false);
              } finally {
                setDeleting(false);
              }
            })()
          }
        >
          Delete resume
        </Button>
      </ConfirmDialog>
      <Dialog
        open={optionsOpen}
        onClose={closeOptions}
        title="AI resume assistant"
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Give an instruction, review the proposal, then apply the changes you
            want. The resume language setting applies to AI generated and edited content.
          </p>
          {aiError && <Alert variant="error">{aiError}</Alert>}
          <label className="form-stack">
            Instruction
            <textarea
              className="field-control"
              rows={3}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
          </label>
          <label className="form-stack">
            Target job description (optional)
            <textarea
              className="field-control"
              rows={3}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
          </label>
          <label className="form-stack">
            Public references (one URL per line)
            <textarea
              className="field-control"
              rows={2}
              value={references}
              onChange={(event) => setReferences(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void requestProposal()}
              disabled={!instruction.trim()}
              loading={aiBusy}
              loadingLabel="Creating proposal…"
            >
              Create proposal
            </Button>
            {undo && (
              <Button
                variant="secondary"
                onClick={() => {
                  updateDocument(undo.document);
                  setUndo(null);
                  setOptionsOpen(false);
                }}
              >
                Undo last AI change
              </Button>
            )}
          </div>
          {proposal && (
            <div className="space-y-3">
              <h3 className="font-semibold">Proposal ready</h3>
              <div className="h-80 overflow-auto border border-[var(--border)]">
                <ResumePreview zoomPercent={50}>
                  <ResumeDocument
                    data={proposal.resume_data}
                    templateId={template.id}
                  />
                </ResumePreview>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setProposal(null)}>
                  Discard
                </Button>
                <Button onClick={applyProposal}>Apply proposal</Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
