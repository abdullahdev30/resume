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

export function FreeResumeEditor({ templateId }: { templateId?: string }) {
  const state = useFreeResume();
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
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
        zoom={state.zoom}
        onZoomChange={(zoom) => state.update({ zoom })}
        headerActions={
          <>
            <details>
              <summary>File</summary>
              <Button variant="ghost" onClick={() => setConfirmClear(true)}>
                Clear data
              </Button>
            </details>
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
          <div className="p-3 text-xs text-[var(--text-muted)]">
            <p>
              Your data is kept only for this browser tab and is deleted when
              you close the tab. Download your resume to keep it.
            </p>
            <p>
              Choose Save as PDF in the print dialog. Enable background graphics
              and disable browser headers and footers.
            </p>
            {state.warning && <Alert variant="warning">{state.warning}</Alert>}
            {error && (
              <Alert variant="error">
                {error}
                <Button onClick={() => void print()}>Retry</Button>
              </Alert>
            )}
          </div>
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
