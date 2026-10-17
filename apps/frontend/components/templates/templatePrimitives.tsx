import { Camera, User as UserIcon } from "lucide-react";
import type { CSSProperties, ChangeEvent, MouseEvent } from "react";

import type { ElementStyle, ResumeData } from "./TemplateOne";

export function createTemplateTools({
  data,
  elementStyles,
  selectedElementId,
  onSelectElement,
  selectionColor,
}: {
  data: ResumeData;
  elementStyles: Record<string, ElementStyle>;
  selectedElementId?: string | null;
  onSelectElement?: (id: string) => void;
  selectionColor: string;
}) {
  const itemStyle = (id: string, defaultColor?: string): CSSProperties => {
    const custom = elementStyles[id];
    return {
      fontWeight: custom?.isBold !== undefined ? (custom.isBold ? "bold" : "normal") : undefined,
      fontStyle: custom?.isItalic !== undefined ? (custom.isItalic ? "italic" : "normal") : undefined,
      textDecoration: custom?.isUnderline !== undefined ? (custom.isUnderline ? "underline" : "none") : undefined,
      textAlign: custom?.align,
      color: custom?.color || defaultColor,
      fontSize: custom?.fontSize ? `${custom.fontSize}pt` : undefined,
      lineHeight: custom?.lineHeight || data.lineSpacing,
      fontFamily: custom?.fontFamily,
      position: custom?.offsetX || custom?.offsetY ? "relative" : undefined,
      zIndex: custom?.offsetX || custom?.offsetY ? 2 : undefined,
      transform: custom?.offsetX || custom?.offsetY ? `translate(${custom.offsetX || 0}px, ${custom.offsetY || 0}px)` : undefined,
    };
  };

  const itemClass = (id: string, baseClass = "") => {
    if (!onSelectElement) return baseClass;
    const selected = selectedElementId === id;
    return `${baseClass} resume-draggable-text resume-element-id--${id} cursor-pointer rounded-xs p-0.5 transition ${
      selected ? "ring-2 ring-offset-1" : "hover:ring-1"
    }`.trim();
  };

  const select = (id: string, event: MouseEvent) => {
    event.stopPropagation();
    onSelectElement?.(id);
  };

  return {
    itemStyle,
    itemClass,
    select,
    selectionStyle: { "--template-selection": selectionColor } as CSSProperties,
  };
}

export function ResumePhoto({
  data,
  onPhotoUpload,
  className,
  imageClassName = "h-full w-full object-cover",
  label = "Candidate photo",
}: {
  data: ResumeData;
  onPhotoUpload?: (file: File) => void;
  className: string;
  imageClassName?: string;
  label?: string;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPhotoUpload?.(file);
  };

  return (
    <label className={`group relative block overflow-hidden ${className}`}>
      {data.avatarUrl ? (
        <img src={data.avatarUrl} alt={label} className={imageClassName} />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400">
          <UserIcon className="h-8 w-8" aria-hidden="true" />
          {onPhotoUpload && <span className="text-[9px] font-bold uppercase tracking-wider">Add photo</span>}
        </span>
      )}
      {onPhotoUpload && (
        <>
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[9px] font-bold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
            <Camera className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Change photo
          </span>
          <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
        </>
      )}
    </label>
  );
}

export function detailLines(value: string): string[] {
  const explicit = value
    .split(/\r?\n/u)
    .map((line) => line.replace(/^[-•]\s*/u, "").trim())
    .filter(Boolean);
  if (explicit.length > 1) return explicit;
  return value
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/u)
    .map((line) => line.trim())
    .filter(Boolean);
}
