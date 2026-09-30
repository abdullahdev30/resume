"use client";

import {
  Download,
  FileText,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { FileUpload, type FileUploadStatus } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { profileApi } from "@/modules/profile/api";
import { resumeApi } from "../api";
import type { ResumeRecord } from "../types";

export function ResumeListClient({
  dashboard = false,
  initialResumes,
  initialProfileIncomplete,
}: {
  dashboard?: boolean;
  initialResumes?: ResumeRecord[];
  initialProfileIncomplete?: boolean;
}) {
  const [resumes, setResumes] = useState<ResumeRecord[]>(initialResumes || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(initialResumes === undefined);
  const [loadError, setLoadError] = useState("");
  const [profileIncomplete, setProfileIncomplete] = useState(initialProfileIncomplete || false);
  const [pendingDelete, setPendingDelete] = useState<ResumeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const uploadController = useRef<AbortController | null>(null);

  const loadResumes = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await resumeApi.list();
      setResumes(response.resumes);
    } catch {
      setLoadError("We could not load your resumes. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialResumes === undefined) void loadResumes();
    if (dashboard && initialProfileIncomplete === undefined) {
      profileApi
        .getProfile()
        .then((profile) => setProfileIncomplete(!profile.personal.phone || !profile.personal.email))
        .catch(() => setProfileIncomplete(true));
    }
    return () => uploadController.current?.abort();
  }, [dashboard, initialProfileIncomplete, initialResumes]);

  const filteredResumes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return resumes;
    return resumes.filter((resume) =>
      `${resume.title} ${resume.resume_type}`.toLowerCase().includes(query),
    );
  }, [resumes, searchQuery]);

  const deleteResume = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await resumeApi.remove(pendingDelete.id);
      setResumes((current) => current.filter((resume) => resume.id !== pendingDelete.id));
      toast.success("Resume deleted.");
      setPendingDelete(null);
    } catch {
      toast.error("The resume could not be deleted. It is still in your library.", "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const downloadResume = async (resume: ResumeRecord) => {
    if (downloadingId) return;
    const downloadWindow = window.open("", "_blank");
    setDownloadingId(resume.id);
    try {
      const { download_url: downloadUrl } = await resumeApi.getPdf(resume.id);
      if (downloadWindow) {
        downloadWindow.opener = null;
        downloadWindow.location.href = downloadUrl;
      } else {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      downloadWindow?.close();
      toast.error("We could not prepare this PDF. Please try again.", "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const uploadResume = async () => {
    if (!uploadFile || uploadStatus === "uploading") return;
    const controller = new AbortController();
    uploadController.current = controller;
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");
    try {
      const created = await resumeApi.uploadPdf(
        uploadFile,
        uploadFile.name.replace(/\.[^/.]+$/, ""),
        { onProgress: setUploadProgress, signal: controller.signal },
      );
      setResumes((current) => [created, ...current]);
      setUploadStatus("success");
      toast.success(`${uploadFile.name} is now in your resume library.`, "Upload complete");
      window.setTimeout(() => closeUpload(), 650);
    } catch (error) {
      if (controller.signal.aborted) {
        setUploadStatus("idle");
        return;
      }
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
      toast.error("Your PDF was not uploaded. Your file is still selected so you can retry.", "Upload failed");
    } finally {
      uploadController.current = null;
    }
  };

  const closeUpload = () => {
    uploadController.current?.abort();
    setUploadOpen(false);
    setUploadFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadError("");
  };

  return (
    <div className="page-stack">
      <Card padding="lg">
        <PageHeader
          eyebrow={dashboard ? "Resume library" : "Your documents"}
          icon={<LayoutGrid size={15} aria-hidden="true" />}
          title={dashboard ? "Your Resumes" : "My Resumes"}
          description="Create, edit, upload, and download resumes securely saved to your account."
          actions={
            <>
              <Button variant="secondary" onClick={() => setUploadOpen(true)}>
                <Upload size={16} aria-hidden="true" />
                Upload PDF
              </Button>
              <Link href="/resumes/create" className="button button-primary">
                <Plus size={16} aria-hidden="true" />
                New resume
              </Link>
            </>
          }
        />
        <div className="mt-6 max-w-md border-t border-[var(--border)] pt-5">
          <Input
            label="Search resumes"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by title or type"
            leading={<Search size={16} aria-hidden="true" />}
          />
        </div>
      </Card>

      {profileIncomplete && (
        <Alert variant="info" className="items-center justify-between">
          <span>Add your contact details to your profile so new resumes can start with your real information.</span>
          <Link href="/settings" className="button button-primary button-sm">Complete profile</Link>
        </Alert>
      )}

      {loading ? (
        <LoadingState label="Loading resumes..." cards={3} />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={() => void loadResumes()} />
      ) : filteredResumes.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching resumes" : "No resumes yet"}
          description={searchQuery ? "Try a different title or clear your search." : "Create your first resume from a template or with AI."}
          action={
            searchQuery ? (
              <Button variant="secondary" onClick={() => setSearchQuery("")}>Clear search</Button>
            ) : (
              <Link href="/resumes/create" className="button button-primary">
                <Plus size={16} aria-hidden="true" />
                Create your first resume
              </Link>
            )
          }
        />
      ) : (
        <section aria-label="Saved resumes" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResumes.map((resume) => (
            <Card key={resume.id} padding="md" interactive className="flex min-h-52 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="state-icon !h-10 !w-10"><FileText size={18} aria-hidden="true" /></div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-[var(--text)]">{resume.title}</h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Updated {formatDate(resume.updated_at)}</p>
                  </div>
                </div>
                {resume.resume_type === "ai" && <Sparkles size={17} className="shrink-0 text-[var(--primary)]" aria-label="AI resume" />}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="primary">{formatResumeType(resume.resume_type)}</Badge>
                <Badge variant={resume.editable ? "success" : "neutral"}>{resume.editable ? "Editable" : "PDF only"}</Badge>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
                <Link href={`/resumes/${resume.id}`} className="button button-secondary button-sm">Open</Link>
                {resume.editable && (
                  <Link href={`/resumes/${resume.id}/edit`} className="button button-ghost button-sm">
                    <Pencil size={14} aria-hidden="true" />
                    Edit
                  </Link>
                )}
                <Button
                  size="sm"
                  onClick={() => void downloadResume(resume)}
                  loading={downloadingId === resume.id}
                  loadingLabel="Preparing..."
                  disabled={Boolean(downloadingId)}
                >
                  <Download size={14} aria-hidden="true" />
                  PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  className="ml-auto text-[var(--danger)]"
                  onClick={() => setPendingDelete(resume)}
                  aria-label={`Delete ${resume.title}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Dialog
        open={uploadOpen}
        title="Upload an existing resume"
        description="PDF files are stored in your account and remain download-only."
        onClose={closeUpload}
        preventClose={uploadStatus === "uploading"}
      >
        <FileUpload
          file={uploadFile}
          accept="application/pdf"
          helperText="PDF up to the server upload limit"
          status={uploadStatus}
          progress={uploadProgress}
          error={uploadError}
          onFileChange={(file) => {
            setUploadFile(file);
            setUploadStatus("idle");
            setUploadError("");
          }}
          onCancel={closeUpload}
          onRetry={() => void uploadResume()}
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={closeUpload} disabled={uploadStatus === "uploading"}>Cancel</Button>
          <Button
            onClick={() => void uploadResume()}
            disabled={!uploadFile}
            loading={uploadStatus === "uploading"}
            loadingLabel="Uploading..."
          >
            Upload resume
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.title || "resume"}?`}
        description="This removes the resume and its generated file from your account. This cannot be undone."
        onClose={() => !deleting && setPendingDelete(null)}
        preventClose={deleting}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>Cancel</Button>
          <Button variant="danger" onClick={() => void deleteResume()} loading={deleting} loadingLabel="Deleting...">Delete resume</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "recently"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatResumeType(value: ResumeRecord["resume_type"]) {
  if (value === "legacy_pdf") return "Uploaded PDF";
  if (value === "ai") return "AI generated";
  return "Template";
}
