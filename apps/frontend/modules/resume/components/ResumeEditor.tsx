"use client";
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-700.css";
import "@fontsource/roboto/latin-400-italic.css";
import "@fontsource/lora/latin-400.css";
import "@fontsource/lora/latin-700.css";

import {
  Eye,
  FileText,
  List,
  Pencil,
  Plus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { EditorResumeData } from "@/modules/resume/types";
import type { LanguageCode } from "@/lib/languages";

import { BrandLogo } from "@/components/common/BrandLogo";
import { AvatarCropDialog } from "@/components/profile/AvatarCropDialog";
import { ResumeDocument } from "@/components/templates/ResumeDocument";
import { ResumePreview } from "@/components/templates/ResumePreview";
import { ResumePrintRoot } from "@/components/templates/ResumePrintRoot";
import type { TemplateItem } from "@/components/templates/catalog";
import { Button } from "@/components/ui/Button";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { Dialog } from "@/components/ui/Dialog";
import { validateFile } from "@/lib/validation";
import {
  blankResume,
  profilePhotoShape,
  supportsProfilePhoto,
} from "@/modules/resume/editorDocument";

import { ResumeForm } from "./ResumeForm";
import { ResumeFormattingToolbar } from "./ResumeFormattingToolbar";
import { InlineResumeInput } from "./InlineResumeInput";
import { getEditableResumeText } from "@/components/templates/editableResumeText";
import { editResumeText } from "@/modules/resume/editorDocument";
import TemplatesClient from "@/app/templates/TemplatesClient";

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

export interface ResumeEditorProps {
  template: TemplateItem;
  resume: EditorResumeData;
  onChange: Dispatch<SetStateAction<EditorResumeData>>;
  title: string;
  onTitleChange: (title: string) => void;
  headerActions: ReactNode;
  assistant?: ReactNode;
  authenticated?: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onNavigate?: () => boolean;
  onTemplateChange?: (template: TemplateItem) => void;
  resumeLanguage: LanguageCode;
  onResumeLanguageChange: (language: LanguageCode) => void;
}

export function ResumeEditor({
  template,
  resume,
  onChange: setResume,
  title,
  onTitleChange,
  headerActions,
  assistant,
  authenticated = false,
  zoom,
  onZoomChange: setZoom,
  onNavigate,
  onTemplateChange,
  resumeLanguage,
  onResumeLanguageChange,
}: ResumeEditorProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const closeSection = useCallback(() => setEditingSection(null), []);
  const outlineLabels = {
    summary: "Professional summary",
    experience: "Work experience",
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    certificates: "Certifications",
    languages: "Languages",
    social_links: "Links",
  };
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [inlineField, setInlineField] = useState<{
    id: string;
    label: string;
    value: string;
    multiline?: boolean;
    target: HTMLElement;
    source: typeof resume;
  } | null>(null);
  const closeInline = useCallback(() => setInlineField(null), []);
  const selectDocumentText = (id: string) => {
    setSelectedElementId(id);
    const field = getEditableResumeText(templateData, id);
    const target = document.querySelector<HTMLElement>(
      `.resume-workspace-preview-canvas .resume-element-id--${CSS.escape(id)}`,
    );
    if (field && target) setInlineField({ ...field, target, source: resume });
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const textDragRef = useRef<TextDragState | null>(null);
  const ignoreCanvasClickRef = useRef(false);
  const templateData = resume;
  const photoSupported = supportsProfilePhoto(template.id);

  const choosePhoto = (file: File) => {
    const error = validateFile(file, {
      allowedTypes: PHOTO_TYPES,
      maxBytes: MAX_PHOTO_BYTES,
      label: "Photo",
    });
    if (error) {
      setPhotoError(error);
      return;
    }
    setPhotoError("");
    setEditingSection(null);
    setCropFile(file);
  };

  const adjustPhoto = async () => {
    if (!resume.avatarUrl) return;
    try {
      const encoded = /^data:(image\/[a-z+.-]+);base64,(.+)$/s.exec(
        resume.avatarUrl,
      );
      if (encoded) {
        const bytes = Uint8Array.from(atob(encoded[2]!), (character) =>
          character.charCodeAt(0),
        );
        choosePhoto(new File([bytes], "resume-photo", { type: encoded[1]! }));
        return;
      }
      const response = await fetch(resume.avatarUrl);
      if (!response.ok) throw new Error("Photo unavailable");
      const blob = await response.blob();
      choosePhoto(new File([blob], "resume-photo", { type: blob.type }));
    } catch {
      setPhotoError(
        "The photo could not be opened. Upload it again to adjust it.",
      );
    }
  };
  const applyPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string")
        setResume((current) => ({
          ...current,
          avatarUrl: reader.result as string,
        }));
      setCropFile(null);
    };
    reader.onerror = () =>
      setPhotoError("The photo could not be read. Try again.");
    reader.readAsDataURL(file);
  };
  const updateResume = (next: EditorResumeData) => setResume(next);
  const resetFormatting = () => {
    const defaults = blankResume(template);
    setResume((current) => ({
      ...current,
      primaryColor: defaults.primaryColor,
      secondaryColor: defaults.secondaryColor,
      pageColor: defaults.pageColor,
      fontFamily: defaults.fontFamily,
      elementStyles: {},
      isBold: false,
      isItalic: false,
      isUnderline: false,
    }));
    setSelectedElementId(null);
  };

  const startTextDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.altKey) return;
    if (event.button !== 0) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      ".resume-draggable-text",
    );
    const page = target?.closest<HTMLElement>(".resume-page");
    if (!target || !page) return;
    const marker = [...target.classList].find((className) =>
      className.startsWith(ELEMENT_CLASS_PREFIX),
    );
    if (!marker) return;

    const id = marker.slice(ELEMENT_CLASS_PREFIX.length);
    const currentStyle = resume.elementStyles[id] || {};
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
    const deltaX = Math.min(
      drag.maxDeltaX,
      Math.max(drag.minDeltaX, event.clientX - drag.startX),
    );
    const deltaY = Math.min(
      drag.maxDeltaY,
      Math.max(drag.minDeltaY, event.clientY - drag.startY),
    );
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) drag.moved = true;
    drag.nextX = Math.round((drag.baseX + deltaX / drag.scale) * 10) / 10;
    drag.nextY = Math.round((drag.baseY + deltaY / drag.scale) * 10) / 10;
    drag.target.style.transform = `translate(${drag.nextX}px, ${drag.nextY}px)`;
  };

  const finishTextDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = textDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.target.classList.remove("is-dragging");
    if (drag.target.hasPointerCapture(event.pointerId))
      drag.target.releasePointerCapture(event.pointerId);
    textDragRef.current = null;
    if (!drag.moved) return;
    ignoreCanvasClickRef.current = true;
    window.setTimeout(() => {
      ignoreCanvasClickRef.current = false;
    }, 0);
    const currentStyle = resume.elementStyles[drag.id] || {};
    updateResume({
      ...resume,
      elementStyles: {
        ...resume.elementStyles,
        [drag.id]: {
          ...currentStyle,
          offsetX: drag.nextX,
          offsetY: drag.nextY,
        },
      },
    });
  };

  return (
    <div
      className={`resume-workspace-editor resume-print-context${authenticated ? " account-resume-editor" : ""}`}
    >
      <header className="resume-workspace-editor-header no-print">
        <div className="resume-workspace-editor-brand-group">
          <Link
            href={authenticated ? "/resumes" : "/templates"}
            onClick={(event) => {
              if (onNavigate && !onNavigate()) event.preventDefault();
            }}
            className="resume-workspace-editor-logo"
            aria-label={authenticated ? "Back to resumes" : "Back to templates"}
          >
            <BrandLogo priority />
          </Link>
          <input
            aria-label="Resume title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="resume-workspace-document-name"
          />
        </div>
        <div className="resume-workspace-editor-header-actions">
          <LanguageSelect id="editor-resume-language" value={resumeLanguage} onChange={onResumeLanguageChange} label="Resume language" />
          {onTemplateChange && <Button variant="secondary" onClick={() => setTemplatePickerOpen(true)}>Change template</Button>}
          <Button
            variant="ghost"
            onClick={() => setEditingSection("Personal information")}
          >
            Photo
          </Button>
          {headerActions}
        </div>
      </header>

      <div
        className="resume-workspace-editor-mobile-tabs no-print"
        role="tablist"
        aria-label="Editor view"
      >
        <button
          role="tab"
          aria-selected={mobileView === "edit"}
          onClick={() => setMobileView("edit")}
        >
          <Pencil size={15} /> Edit
        </button>
        <button
          role="tab"
          aria-selected={mobileView === "preview"}
          onClick={() => setMobileView("preview")}
        >
          <Eye size={15} /> Preview
        </button>
      </div>

      <div className="resume-workspace-editor-full-toolbar no-print">
        <ResumeFormattingToolbar
          resume={resume}
          selectedElementId={selectedElementId}
          onChange={updateResume}
          onClearSelection={() => setSelectedElementId(null)}
          onResetFormatting={resetFormatting}
          trailingControls={
            <div
              className="resume-workspace-zoom-controls"
              aria-label="Preview zoom"
            >
              <button
                type="button"
                onClick={() => setZoom(Math.max(30, zoom - 10))}
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <output aria-live="polite">{zoom}%</output>
              <button
                type="button"
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          }
        />
      </div>
      <main
        className={`resume-workspace-editor-workspace no-print ${sidebarOpen ? "" : "is-sidebar-collapsed"}`}
      >
        <aside
          id="resume-workspace-editor-details"
          className={`resume-workspace-editor-form-panel ${mobileView === "edit" ? "is-mobile-active" : ""}`}
        >
          <nav
            className="resume-workspace-document-outline"
            aria-label="Document outline"
          >
            <div className="resume-workspace-outline-heading">
              <h2>Document tabs</h2>
              <button
                type="button"
                aria-label="Manage resume sections"
                onClick={() => setEditingSection("Section order")}
              >
                <Plus size={18} />
              </button>
            </div>
            <button
              type="button"
              className="resume-workspace-outline-tab"
              onClick={() =>
                document
                  .querySelector(
                    ".resume-workspace-preview-canvas .resume-page",
                  )
                  ?.scrollIntoView({ block: "nearest" })
              }
            >
              <FileText size={18} />
              <span>Tab 1</span>
            </button>
            <ul>
              <li>
                <button
                  type="button"
                  className={
                    !editingSection || editingSection === "Personal information"
                      ? "is-active"
                      : ""
                  }
                  onClick={() => setEditingSection("Personal information")}
                >
                  {resume.fullName || "Your Name"}
                </button>
              </li>
              {resume.sectionOrder.map((section) => (
                <li key={section}>
                  <button
                    type="button"
                    className={
                      editingSection === outlineLabels[section]
                        ? "is-active"
                        : ""
                    }
                    onClick={() => setEditingSection(outlineLabels[section])}
                  >
                    {section === "social_links"
                      ? "Contact links"
                      : outlineLabels[section]}
                  </button>
                  {section === "projects" &&
                    resume.projects.map((project) => (
                      <button
                        type="button"
                        className="resume-workspace-outline-entry"
                        key={project.id}
                        onClick={() => setEditingSection("Projects")}
                      >
                        {project.name || "Project Name"}
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <section
          className={`resume-workspace-editor-preview-panel ${mobileView === "preview" ? "is-mobile-active" : ""}`}
          aria-label="Live resume preview"
        >
          <div
            className="resume-workspace-preview-canvas"
            onClickCapture={(event) => {
              if (
                (event.target as HTMLElement).closest(".resume-draggable-text")
              )
                event.preventDefault();
            }}
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
            <button
              type="button"
              className="resume-workspace-canvas-details-toggle"
              aria-label={
                sidebarOpen ? "Hide resume details" : "Show resume details"
              }
              aria-expanded={sidebarOpen}
              aria-controls="resume-workspace-editor-details"
              title={
                sidebarOpen ? "Hide resume details" : "Show resume details"
              }
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setSidebarOpen(!sidebarOpen);
                setMobileView(sidebarOpen ? "preview" : "edit");
              }}
            >
              <List size={22} aria-hidden="true" />
            </button>
            <ResumePreview zoomPercent={zoom}>
              <ResumeDocument
                data={templateData}
                templateId={template.id}
                selectedElementId={selectedElementId}
                onSelectElement={selectDocumentText}
                onPhotoUpload={photoSupported ? choosePhoto : undefined}
                elementStyles={templateData.elementStyles}
              />
            </ResumePreview>
          </div>
          {assistant}
        </section>
      </main>
      {photoError && (
        <p
          className="resume-workspace-canvas-photo-error no-print"
          role="alert"
        >
          {photoError}
        </p>
      )}
      {inlineField && (
        <InlineResumeInput
          key={inlineField.id}
          {...inlineField}
          onChange={(value) =>
            setResume((current) =>
              editResumeText(current, inlineField.id, value),
            )
          }
          onClose={closeInline}
        />
      )}

      <Dialog
        open={Boolean(editingSection)}
        title={editingSection || "Resume details"}
        onClose={closeSection}
        className="resume-workspace-section-edit-dialog"
      >
        <ResumeForm
          key={editingSection}
          activeSection={editingSection}
          resume={resume}
          onChange={updateResume}
          photoSupported={photoSupported}
          onChoosePhoto={choosePhoto}
          onAdjustPhoto={() => void adjustPhoto()}
          photoError={photoError}
        />
      </Dialog>
      <ResumePrintRoot data={templateData} templateId={template.id} />
      <Dialog
        open={templatePickerOpen}
        title="Change resume template"
        description="Choose a new design. Your resume details will stay in place."
        onClose={() => setTemplatePickerOpen(false)}
        className="max-w-6xl"
      >
        <TemplatesClient onSelect={(nextTemplate) => {
          onTemplateChange?.(nextTemplate);
          setTemplatePickerOpen(false);
        }} />
      </Dialog>
      <AvatarCropDialog
        file={cropFile}
        shape={profilePhotoShape(template.id)}
        onClose={() => setCropFile(null)}
        onConfirm={applyPhoto}
      />
    </div>
  );
}
