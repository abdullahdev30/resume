"use client";

import { ArrowLeft, Eye, FileDown, LockKeyhole, PanelLeftClose, PanelLeftOpen, Pencil, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BrandLogo } from "@/components/common/BrandLogo";
import { AvatarCropDialog } from "@/components/profile/AvatarCropDialog";
import { ResumeDocument } from "@/components/templates/ResumeDocument";
import { ResumePreview } from "@/components/templates/ResumePreview";
import { ResumePrintRoot } from "@/components/templates/ResumePrintRoot";
import type { TemplateItem } from "@/components/templates/catalog";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { validateFile } from "@/lib/validation";
import {
  createBlankGuestResume,
  profilePhotoShape,
  supportsProfilePhoto,
  toTemplateResumeData,
} from "@/modules/guest-resume/model";

import { GuestResumeForm } from "./GuestResumeForm";
import { GuestFormattingToolbar } from "./GuestFormattingToolbar";

const LEAVE_MESSAGE = "Your resume is not saved. Leaving this editor will discard your information.";
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ELEMENT_CLASS_PREFIX = "resume-element-id--";

interface TextDragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  nextX: number;
  nextY: number;
  minDeltaX: number;
  maxDeltaX: number;
  minDeltaY: number;
  maxDeltaY: number;
  scale: number;
  target: HTMLElement;
  moved: boolean;
}

export function GuestResumeEditor({ template }: { template: TemplateItem }) {
  const [resume, setResume] = useState(() => createBlankGuestResume(template));
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [zoom, setZoom] = useState(100);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [printStatus, setPrintStatus] = useState<"idle" | "preparing">("idle");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const photoUrlRef = useRef("");
  const textDragRef = useRef<TextDragState | null>(null);
  const ignoreCanvasClickRef = useRef(false);
  const initialResumeSignature = useRef(JSON.stringify(resume));

  const dirty = useMemo(() => JSON.stringify(resume) !== initialResumeSignature.current, [resume]);
  const templateData = useMemo(() => toTemplateResumeData(resume), [resume]);
  const photoSupported = supportsProfilePhoto(template.id);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = LEAVE_MESSAGE;
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  useEffect(() => () => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
  }, []);

  const confirmNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (dirty && !window.confirm(LEAVE_MESSAGE)) event.preventDefault();
  };

  const choosePhoto = (file: File) => {
    const error = validateFile(file, { allowedTypes: PHOTO_TYPES, maxBytes: MAX_PHOTO_BYTES, label: "Photo" });
    if (error) {
      setPhotoError(error);
      return;
    }
    setPhotoError("");
    setCropFile(file);
  };

  const applyPhoto = (file: File) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    const photoUrl = URL.createObjectURL(file);
    photoUrlRef.current = photoUrl;
    setResume((current) => ({ ...current, personal: { ...current.personal, photoUrl } }));
    setCropFile(null);
  };

  const updateResume = (nextResume: typeof resume) => {
    if (resume.personal.photoUrl && !nextResume.personal.photoUrl && photoUrlRef.current) {
      URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = "";
    }
    setResume(nextResume);
  };

  const resetFormatting = () => {
    const defaults = createBlankGuestResume(template).appearance;
    setResume((current) => ({ ...current, appearance: defaults }));
    setSelectedElementId(null);
  };

  const startTextDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(".resume-draggable-text");
    const page = target?.closest<HTMLElement>(".resume-page");
    if (!target || !page) return;
    const marker = [...target.classList].find((className) => className.startsWith(ELEMENT_CLASS_PREFIX));
    if (!marker) return;

    const id = marker.slice(ELEMENT_CLASS_PREFIX.length);
    const currentStyle = resume.appearance.elementStyles[id] || {};
    const pageRect = page.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const scale = Math.max(0.01, pageRect.width / page.offsetWidth);
    textDragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: currentStyle.offsetX || 0,
      baseY: currentStyle.offsetY || 0,
      nextX: currentStyle.offsetX || 0,
      nextY: currentStyle.offsetY || 0,
      minDeltaX: pageRect.left - targetRect.left,
      maxDeltaX: pageRect.right - targetRect.right,
      minDeltaY: pageRect.top - targetRect.top,
      maxDeltaY: pageRect.bottom - targetRect.bottom,
      scale,
      target,
      moved: false,
    };
    target.setPointerCapture(event.pointerId);
    target.classList.add("is-dragging");
    setSelectedElementId(id);
    event.preventDefault();
  };

  const moveTextDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = textDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = Math.min(drag.maxDeltaX, Math.max(drag.minDeltaX, event.clientX - drag.startX));
    const deltaY = Math.min(drag.maxDeltaY, Math.max(drag.minDeltaY, event.clientY - drag.startY));
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) drag.moved = true;
    drag.nextX = Math.round((drag.baseX + deltaX / drag.scale) * 10) / 10;
    drag.nextY = Math.round((drag.baseY + deltaY / drag.scale) * 10) / 10;
    drag.target.style.transform = `translate(${drag.nextX}px, ${drag.nextY}px)`;
  };

  const finishTextDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = textDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.target.classList.remove("is-dragging");
    if (drag.target.hasPointerCapture(event.pointerId)) drag.target.releasePointerCapture(event.pointerId);
    textDragRef.current = null;
    if (!drag.moved) return;
    ignoreCanvasClickRef.current = true;
    window.setTimeout(() => { ignoreCanvasClickRef.current = false; }, 0);
    const currentStyle = resume.appearance.elementStyles[drag.id] || {};
    updateResume({
      ...resume,
      appearance: {
        ...resume.appearance,
        elementStyles: {
          ...resume.appearance.elementStyles,
          [drag.id]: { ...currentStyle, offsetX: drag.nextX, offsetY: drag.nextY },
        },
      },
    });
  };

  const printResume = async () => {
    if (printStatus === "preparing") return;
    setPrintStatus("preparing");
    try {
      if ("fonts" in document) await document.fonts.ready;
      const images = Array.from(document.querySelectorAll<HTMLImageElement>("#resume-print-root img"));
      await Promise.all(images.map(async (image) => {
        if (image.complete) return;
        try { await image.decode(); } catch { /* The print dialog can still render the remaining document. */ }
      }));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      window.print();
    } finally {
      setPrintStatus("idle");
    }
  };

  return (
    <div className="guest-editor resume-print-context">
      <header className="guest-editor-header no-print">
        <div className="guest-editor-brand-group">
          <Link href="/" onClick={confirmNavigation} className="public-brand" aria-label="Resume Builder home">
            <BrandLogo className="public-brand-logo" priority />
            <span>Resume Builder</span>
          </Link>
          <span className="guest-editor-divider" aria-hidden="true" />
          <div className="guest-editor-title">
            <strong>{template.name}</strong>
            <span><LockKeyhole size={12} aria-hidden="true" /> Temporary guest session</span>
          </div>
        </div>
        <div className="guest-editor-header-actions">
          <ThemeToggle />
          <Button onClick={() => void printResume()} loading={printStatus === "preparing"} loadingLabel="Preparing PDF...">
            <FileDown size={16} aria-hidden="true" /> Download PDF
          </Button>
        </div>
      </header>

      <div className="guest-editor-mobile-tabs no-print" role="tablist" aria-label="Editor view">
        <button role="tab" aria-selected={mobileView === "edit"} onClick={() => setMobileView("edit")}><Pencil size={15} /> Edit</button>
        <button role="tab" aria-selected={mobileView === "preview"} onClick={() => setMobileView("preview")}><Eye size={15} /> Preview</button>
      </div>

      <main className={`guest-editor-workspace no-print ${sidebarOpen ? "" : "is-sidebar-collapsed"}`}>
        <aside id="guest-editor-details" className={`guest-editor-form-panel ${mobileView === "edit" ? "is-mobile-active" : ""}`}>
          <div className="guest-editor-panel-heading">
            <div className="guest-editor-panel-heading-row">
              <Link href="/templates" onClick={confirmNavigation} className="template-back-link"><ArrowLeft size={15} /> Templates</Link>
              <button
                type="button"
                className="guest-details-close"
                onClick={() => {
                  setSidebarOpen(false);
                  setMobileView("preview");
                }}
                title="Close details panel"
              >
                <PanelLeftClose size={15} /> Close details
              </button>
            </div>
            <h1>Resume details</h1>
            <p>Changes appear in the preview instantly. Nothing is uploaded or saved.</p>
          </div>
          <GuestResumeForm
            resume={resume}
            onChange={updateResume}
            photoSupported={photoSupported}
            onChoosePhoto={choosePhoto}
            photoError={photoError}
          />
        </aside>

        <section className={`guest-editor-preview-panel ${mobileView === "preview" ? "is-mobile-active" : ""}`} aria-label="Live resume preview">
          <div className="guest-preview-toolbar">
            <div>
              <strong>Live {resume.appearance.pageSize} {resume.appearance.pageOrientation} preview</strong>
              <span>{dirty ? "Unsaved changes" : "Start adding your details"}</span>
            </div>
            <div className="guest-preview-toolbar-actions">
              {!sidebarOpen && (
                <button
                  type="button"
                  className="guest-sidebar-toggle"
                  onClick={() => setSidebarOpen(true)}
                  aria-expanded="false"
                  aria-controls="guest-editor-details"
                  title="Open details panel"
                >
                  <PanelLeftOpen size={16} />
                  <span>Open details</span>
                </button>
              )}
              <div className="guest-zoom-controls" aria-label="Preview zoom">
                <button type="button" onClick={() => setZoom((value) => Math.max(60, value - 10))} aria-label="Zoom out"><ZoomOut size={16} /></button>
                <output aria-live="polite">{zoom}%</output>
                <button type="button" onClick={() => setZoom((value) => Math.min(130, value + 10))} aria-label="Zoom in"><ZoomIn size={16} /></button>
              </div>
            </div>
          </div>
          <GuestFormattingToolbar
            resume={resume}
            selectedElementId={selectedElementId}
            onChange={updateResume}
            onClearSelection={() => setSelectedElementId(null)}
            onResetFormatting={resetFormatting}
          />
          <div
            className="guest-preview-canvas"
            onClick={() => {
              if (ignoreCanvasClickRef.current) {
                ignoreCanvasClickRef.current = false;
                return;
              }
              setSelectedElementId(null);
            }}
            onPointerDown={startTextDrag}
            onPointerMove={moveTextDrag}
            onPointerUp={finishTextDrag}
            onPointerCancel={finishTextDrag}
          >
            <ResumePreview zoomPercent={zoom}>
              <ResumeDocument
                data={templateData}
                templateId={template.id}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                elementStyles={templateData.elementStyles}
              />
            </ResumePreview>
          </div>
          <div className="guest-print-help">
            Choose <strong>Save as PDF</strong> in the print dialog. Enable <strong>Background graphics</strong> if your browser offers that option.
          </div>
        </section>
      </main>

      <ResumePrintRoot data={templateData} templateId={template.id} />
      <AvatarCropDialog
        file={cropFile}
        shape={profilePhotoShape(template.id)}
        onClose={() => setCropFile(null)}
        onConfirm={applyPhoto}
      />
    </div>
  );
}
