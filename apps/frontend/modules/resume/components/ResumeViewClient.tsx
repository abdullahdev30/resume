"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback/Alert";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { ResumeDocument } from "@/components/templates/ResumeDocument";
import { ResumePreview } from "@/components/templates/ResumePreview";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { useApiQuery } from "@/lib/use-api-query";
import { downloadStoredPdf } from "../downloadStoredPdf";
import type { ResumeRecord } from "../types";
export function ResumeViewClient({ resumeId }: { resumeId: string }) {
  const query = useApiQuery<ResumeRecord>(`/resumes/${resumeId}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHtml, setShowHtml] = useState(false);
  const html = useApiQuery<{ html: string }>(
    `/resumes/${resumeId}/html?extracted=true`,
    { enabled: showHtml },
  );
  const download = async () => {
    setBusy(true);
    setError("");
    try {
      await downloadStoredPdf(resumeId);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Download failed. Retry.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!query.data)
    return query.error ? (
      <ErrorState
        message={query.error.message}
        onRetry={() => void query.refetch()}
      />
    ) : (
      <LoadingState label="Loading resume..." />
    );
  const resume = query.data;
  return (
    <div className="page-stack">
      <PageHeader
        title={resume.title}
        description="Your resume and PDF are saved privately to your account."
        actions={
          <>
            <Link className="button button-secondary" href="/resumes">
              Back to resumes
            </Link>
            {resume.editable && (
              <Link
                className="button button-secondary"
                href={`/editor/${resume.template_id || "1"}?resumeId=${resume.id}`}
              >
                Edit resume
              </Link>
            )}
            <Button onClick={() => void download()} loading={busy}>
              Download PDF
            </Button>
          </>
        }
      />
      {error && <Alert variant="error">{error}</Alert>}
      <Button variant="secondary" onClick={() => setShowHtml(!showHtml)}>
        View PDF as HTML
      </Button>
      {showHtml &&
        (html.data ? (
          <iframe
            title="Extracted PDF HTML"
            sandbox=""
            srcDoc={html.data.html}
            className="h-96 w-full border"
          />
        ) : html.error ? (
          <Alert variant="error">{html.error.message}</Alert>
        ) : (
          <LoadingState label="Reading PDF..." />
        ))}
      {resume.editable && resume.resume_data ? (
        <ResumePreview zoomPercent={75}>
          <ResumeDocument
            data={resume.resume_data as ResumeData}
            templateId={resume.template_id || "1"}
          />
        </ResumePreview>
      ) : (
        <p>
          This previously uploaded PDF is available for viewing and downloading.
        </p>
      )}
    </div>
  );
}
