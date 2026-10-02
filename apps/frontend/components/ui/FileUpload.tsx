"use client";

import { FileText, RotateCcw, Upload, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "./Button";

export type FileUploadStatus = "idle" | "uploading" | "success" | "error";

export function FileUpload({
  label = "Choose a file or drag it here",
  helperText,
  accept,
  file,
  status = "idle",
  progress = 0,
  error,
  disabled = false,
  maxBytes = 10 * 1024 * 1024,
  onFileChange,
  onCancel,
  onRetry,
}: {
  label?: string;
  helperText?: string;
  accept?: string;
  file: File | null;
  status?: FileUploadStatus;
  progress?: number;
  error?: string;
  disabled?: boolean;
  maxBytes?: number;
  onFileChange: (file: File | null) => void;
  onCancel?: () => void;
  onRetry?: () => void;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const choose = (nextFile?: File) => {
    if (!nextFile || disabled || status === "uploading") return;
    const acceptedTypes = (accept || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && !item.startsWith("."));
    if (acceptedTypes.length && !acceptedTypes.includes(nextFile.type)) {
      setSelectionError("Choose a supported file type.");
      onFileChange(null);
      return;
    }
    if (nextFile.size > maxBytes) {
      setSelectionError(`The file must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.`);
      onFileChange(null);
      return;
    }
    setSelectionError("");
    onFileChange(nextFile);
  };

  return (
    <div
      className={["file-upload", dragging ? "is-dragging" : ""].filter(Boolean).join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        choose(event.dataTransfer.files[0]);
      }}
    >
      <div className="file-upload-preview">
        {previewUrl ? <img src={previewUrl} alt="Selected file preview" /> : <FileText size={24} aria-hidden="true" />}
      </div>
      <div>
        <div className="font-semibold text-[var(--text)]">{file?.name || label}</div>
        <div className="mt-1 text-xs">{file ? formatFileSize(file.size) : helperText}</div>
      </div>
      <label className="button button-secondary button-sm" htmlFor={inputId} aria-disabled={disabled || status === "uploading"}>
        <Upload size={15} aria-hidden="true" />
        Browse
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept={accept}
          disabled={disabled || status === "uploading"}
          onChange={(event) => choose(event.target.files?.[0])}
        />
      </label>
      {status === "uploading" && (
        <div className="w-full" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progress"><div className="progress-bar" style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} /></div>
          <p className="mt-2 text-xs">Uploading... {Math.round(progress)}%</p>
        </div>
      )}
      {(selectionError || error) && <p className="field-error" role="alert">{selectionError || error}</p>}
      {(file || selectionError || error) && (
        <div className="flex gap-2">
          {error && onRetry && (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              <RotateCcw size={14} aria-hidden="true" />
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={status === "uploading" && !onCancel}
            onClick={() => {
              onCancel?.();
              setSelectionError("");
              onFileChange(null);
            }}
          >
            <X size={14} aria-hidden="true" />
            {status === "uploading" ? "Cancel" : "Remove"}
          </Button>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
