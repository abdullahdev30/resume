"use client";
import { useEffect, useState } from "react";
import { templateCatalog } from "@/components/templates/catalog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { LoadingState } from "@/components/common/LoadingState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useFreeResume } from "../store";
import { downloadResumePdf } from "../downloadResumePdf";
import { ResumeEditor } from "./ResumeEditor";
import { getResumeLanguagePreference, setResumeLanguagePreference } from "@/lib/resume-language-preference";
import type { LanguageCode } from "@/lib/languages";

export function FreeResumeEditor({ templateId }: { templateId?: string }) {
  const state = useFreeResume();
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [resumeLanguage, setResumeLanguage] = useState<LanguageCode>("en");
  useEffect(() => setResumeLanguage(getResumeLanguagePreference()), []);
  useEffect(() => {
    void useFreeResume.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (!state.hydrated) return;
    const current = useFreeResume.getState();
    if (!current.exists) current.start(templateId || "1");
  }, [state.hydrated, templateId]);
  const print = async () => {
    setPrinting(true);
    setError("");
    try {
      await downloadResumePdf(state.title);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Printing failed. Please retry.",
      );
    } finally {
      setPrinting(false);
    }
  };
  if (!state.hydrated || !state.exists)
    return <LoadingState label="Restoring your resume…" />;
  const template =
    templateCatalog.find((item) => item.id === state.templateId) ||
    templateCatalog[0]!;
  return (
    <>
      <ResumeEditor
        template={template}
        resumeLanguage={resumeLanguage}
        onResumeLanguageChange={(value) => {
          setResumeLanguage(value);
          setResumeLanguagePreference(value);
        }}
        resume={state.data}
        onChange={(next) =>
          state.update({
            data:
              typeof next === "function"
                ? next(useFreeResume.getState().data)
                : next,
          })
        }
        title={state.title}
        onTitleChange={(title) => state.update({ title })}
        onTemplateChange={(nextTemplate) => state.update({ templateId: nextTemplate.id })}
        zoom={state.zoom}
        onZoomChange={(zoom) => state.update({ zoom })}
        headerActions={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(true)}>
              Clear data
            </Button>
            <Button
              onClick={() => void print()}
              loading={printing}
              loadingLabel="Preparing PDF…"
            >
              Download PDF
            </Button>
          </>
        }
        assistant={
          state.warning || error ? (
            <div className="p-3 text-xs text-[var(--text-muted)]">
              {state.warning && (
                <Alert variant="warning">{state.warning}</Alert>
              )}
              {error && (
                <Alert variant="error">
                  {error}
                  <Button onClick={() => void print()}>Retry</Button>
                </Alert>
              )}
            </div>
          ) : undefined
        }
      />
      <ConfirmDialog
        open={confirmClear}
        title="Clear resume data?"
        description="This removes the draft from this browser tab."
        onClose={() => setConfirmClear(false)}
      >
        <Button variant="secondary" onClick={() => setConfirmClear(false)}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            state.clear();
            state.start(state.templateId);
            setConfirmClear(false);
          }}
        >
          Clear data
        </Button>
      </ConfirmDialog>
    </>
  );
}
