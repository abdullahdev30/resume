"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  CirclePlus,
  FileText,
  Italic,
  Minus,
  Plus,
  Pipette,
  RotateCcw,
  Underline,
  X,
} from "lucide-react";

import type { ElementStyle } from "@/components/templates/TemplateOne";
import type { ReactNode } from 'react';
import type { GuestResumeDocument } from "@/modules/guest-resume/types";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48];
const TEXT_COLORS = [
  "#000000",
  "#262626",
  "#525252",
  "#737373",
  "#a3a3a3",
  "#d4d4d4",
  "#e5e5e5",
  "#f5f5f5",
  "#fafafa",
  "#ffffff",
  "#fee2e2",
  "#ffedd5",
  "#fef3c7",
  "#fef9c3",
  "#ecfccb",
  "#d1fae5",
  "#cffafe",
  "#dbeafe",
  "#ede9fe",
  "#fae8ff",
  "#fecaca",
  "#fed7aa",
  "#fde68a",
  "#fef08a",
  "#d9f99d",
  "#a7f3d0",
  "#a5f3fc",
  "#bfdbfe",
  "#ddd6fe",
  "#f5d0fe",
  "#fca5a5",
  "#fdba74",
  "#fcd34d",
  "#fde047",
  "#bef264",
  "#6ee7b7",
  "#67e8f9",
  "#93c5fd",
  "#c4b5fd",
  "#f0abfc",
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#facc15",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#e879f9",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#65a30d",
  "#059669",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
  "#b91c1c",
  "#c2410c",
  "#b45309",
  "#a16207",
  "#4d7c0f",
  "#047857",
  "#0e7490",
  "#1d4ed8",
  "#6d28d9",
  "#a21caf",
  "#991b1b",
  "#9a3412",
  "#92400e",
  "#854d0e",
  "#3f6212",
  "#065f46",
  "#155e75",
  "#1e40af",
  "#5b21b6",
  "#86198f",
];
const PAGE_COLORS = [
  "#ffffff",
  "#fff7ed",
  "#fff4db",
  "#f1f5f9",
  "#eff6ff",
  "#ecfdf5",
  "#fff1f2",
  "#f5f3ff",
];

export function GuestFormattingToolbar({
  resume,
  selectedElementId,
  onChange,
  onClearSelection,
  onResetFormatting,
  trailingControls,
}: {
  resume: GuestResumeDocument;
  selectedElementId: string | null;
  onChange: (resume: GuestResumeDocument) => void;
  onClearSelection: () => void;
  onResetFormatting: () => void;
  trailingControls?: ReactNode;
}) {
  const appearance = resume.appearance;
  const style = selectedElementId
    ? appearance.elementStyles[selectedElementId] || {}
    : {};

  const updateAppearance = (
    patch: Partial<GuestResumeDocument["appearance"]>,
  ) => {
    onChange({ ...resume, appearance: { ...appearance, ...patch } });
  };

  const updateStyle = (patch: Partial<ElementStyle>) => {
    if (!selectedElementId) return;
    updateAppearance({
      elementStyles: {
        ...appearance.elementStyles,
        [selectedElementId]: { ...style, ...patch },
      },
    });
  };

  const resetStyle = () => {
    if (!selectedElementId) return;
    const nextStyles = { ...appearance.elementStyles };
    delete nextStyles[selectedElementId];
    updateAppearance({ elementStyles: nextStyles });
  };

  const fontSize = style.fontSize || 12;
  const visibleFontSizes = FONT_SIZES.includes(fontSize)
    ? FONT_SIZES
    : [...FONT_SIZES, fontSize].sort((left, right) => left - right);
  const contextFontFamily = selectedElementId
    ? style.fontFamily || ""
    : appearance.fontFamily;
  const contextLineHeight = selectedElementId
    ? style.lineHeight
      ? String(style.lineHeight)
      : ""
    : String(appearance.lineSpacing);
  const contextBold = selectedElementId
    ? style.isBold === true
    : appearance.isBold;
  const contextItalic = selectedElementId
    ? style.isItalic === true
    : appearance.isItalic;
  const contextUnderline = selectedElementId
    ? style.isUnderline === true
    : appearance.isUnderline;
  const contextAlign = selectedElementId ? style.align : appearance.textAlign;

  return (
    <div className="guest-format-toolbar" aria-label="Resume formatting">
      <div className="guest-docs-toolbar">
        {trailingControls && <div className="guest-toolbar-zoom">{trailingControls}</div>}
        {selectedElementId && (
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Clear text selection"
            title="Clear selection"
          >
            <X size={13} />
          </button>
        )}
        <PageOptionsDropdown
          appearance={appearance}
          onChange={updateAppearance}
        />
        <span className="guest-toolbar-divider" aria-hidden="true" />
        <span className="guest-format-context">
          {selectedElementId ? "Text" : "Document"}
        </span>
        <FontSelect
          value={contextFontFamily}
          onChange={(fontFamily) =>
            selectedElementId
              ? updateStyle({ fontFamily: fontFamily || undefined })
              : updateAppearance({ fontFamily })
          }
          label={selectedElementId ? "Selected text font" : "Document font"}
          includeTemplateFont={Boolean(selectedElementId)}
        />
        <span
          className={`guest-format-size ${selectedElementId ? "" : "is-disabled"}`}
          aria-label="Font size in points"
        >
          <button
            type="button"
            disabled={!selectedElementId}
            onClick={() => updateStyle({ fontSize: Math.max(6, fontSize - 1) })}
            aria-label="Decrease font size"
          >
            <Minus size={14} />
          </button>
          <select
            disabled={!selectedElementId}
            value={fontSize}
            onChange={(event) =>
              updateStyle({ fontSize: Number(event.target.value) })
            }
            aria-label="Font size"
          >
            {visibleFontSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedElementId}
            onClick={() =>
              updateStyle({ fontSize: Math.min(96, fontSize + 1) })
            }
            aria-label="Increase font size"
          >
            <Plus size={14} />
          </button>
        </span>
        <span className="guest-toolbar-divider" aria-hidden="true" />
        <span className="guest-format-button-group" aria-label="Text emphasis">
          <ToggleButton
            active={contextBold}
            label="Bold"
            onClick={() =>
              selectedElementId
                ? updateStyle({ isBold: !style.isBold })
                : updateAppearance({ isBold: !appearance.isBold })
            }
          >
            <Bold size={15} />
          </ToggleButton>
          <ToggleButton
            active={contextItalic}
            label="Italic"
            onClick={() =>
              selectedElementId
                ? updateStyle({ isItalic: !style.isItalic })
                : updateAppearance({ isItalic: !appearance.isItalic })
            }
          >
            <Italic size={15} />
          </ToggleButton>
          <ToggleButton
            active={contextUnderline}
            label="Underline"
            onClick={() =>
              selectedElementId
                ? updateStyle({ isUnderline: !style.isUnderline })
                : updateAppearance({ isUnderline: !appearance.isUnderline })
            }
          >
            <Underline size={15} />
          </ToggleButton>
        </span>
        <ColorVariantDropdown
          label="Text color"
          value={style.color || "#0f172a"}
          colors={TEXT_COLORS}
          onChange={(color) => updateStyle({ color })}
          disabled={!selectedElementId}
        />
        <span className="guest-toolbar-divider" aria-hidden="true" />
        <span className="guest-format-button-group" aria-label="Text alignment">
          <ToggleButton
            active={contextAlign === "left"}
            label="Align left"
            onClick={() =>
              selectedElementId
                ? updateStyle({ align: "left" })
                : updateAppearance({ textAlign: "left" })
            }
          >
            <AlignLeft size={15} />
          </ToggleButton>
          <ToggleButton
            active={contextAlign === "center"}
            label="Align center"
            onClick={() =>
              selectedElementId
                ? updateStyle({ align: "center" })
                : updateAppearance({ textAlign: "center" })
            }
          >
            <AlignCenter size={15} />
          </ToggleButton>
          <ToggleButton
            active={contextAlign === "right"}
            label="Align right"
            onClick={() =>
              selectedElementId
                ? updateStyle({ align: "right" })
                : updateAppearance({ textAlign: "right" })
            }
          >
            <AlignRight size={15} />
          </ToggleButton>
        </span>
        <ToolbarSelect
          label="Line spacing"
          value={contextLineHeight}
          onChange={(value) =>
            selectedElementId
              ? updateStyle({ lineHeight: value ? Number(value) : undefined })
              : updateAppearance({ lineSpacing: Number(value) })
          }
          options={
            selectedElementId
              ? ["", "1", "1.15", "1.5", "2"]
              : ["1", "1.15", "1.5", "2"]
          }
          formatOption={(value) =>
            value ? `${value} spacing` : "Line spacing"
          }
        />
        <button
          type="button"
          className="guest-format-reset"
          onClick={selectedElementId ? resetStyle : onResetFormatting}
          title={
            selectedElementId
              ? "Reset selected text formatting"
              : "Reset document formatting"
          }
          aria-label={
            selectedElementId
              ? "Reset selected text formatting"
              : "Reset document formatting"
          }
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

function FontSelect({
  value,
  onChange,
  label,
  includeTemplateFont = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  includeTemplateFont?: boolean;
}) {
  return (
    <label className="guest-format-select guest-format-font">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {includeTemplateFont && <option value="">Template font</option>}
        <option value="Inter, sans-serif">Inter</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
        <option value="'Courier New', monospace">Courier</option>
      </select>
    </label>
  );
}

function ToolbarSelect({
  label,
  value,
  options,
  onChange,
  formatOption = (option) => option,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  formatOption?: (value: string) => string;
}) {
  return (
    <label className="guest-format-select">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option || "default"} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageOptionsDropdown({
  appearance,
  onChange,
}: {
  appearance: GuestResumeDocument["appearance"];
  onChange: (patch: Partial<GuestResumeDocument["appearance"]>) => void;
}) {
  return (
    <details className="guest-page-options">
      <summary>
        <FileText size={14} aria-hidden="true" />
        Page
        <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div className="guest-page-options-menu">
        <label>
          <span>Page size</span>
          <select
            aria-label="Page size"
            value={appearance.pageSize}
            onChange={(event) =>
              onChange({
                pageSize: event.target
                  .value as GuestResumeDocument["appearance"]["pageSize"],
              })
            }
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
            <option value="A5">A5</option>
            <option value="B5">B5</option>
            <option value="Tabloid">Tabloid</option>
          </select>
        </label>
        <label>
          <span>Orientation</span>
          <select
            aria-label="Page orientation"
            value={appearance.pageOrientation}
            onChange={(event) =>
              onChange({
                pageOrientation: event.target
                  .value as GuestResumeDocument["appearance"]["pageOrientation"],
              })
            }
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label>
          <span>Margins</span>
          <select
            aria-label="Page margins"
            value={appearance.pageMargin}
            onChange={(event) =>
              onChange({ pageMargin: Number(event.target.value) })
            }
          >
            {[5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40].map((margin) => (
              <option key={margin} value={margin}>
                {margin} mm
              </option>
            ))}
          </select>
        </label>
        <div className="guest-page-color-field">
          <span>Page color</span>
          <div className="guest-page-color-swatches">
            {PAGE_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                className={
                  appearance.pageColor.toLowerCase() === color
                    ? "is-active"
                    : ""
                }
                style={{ backgroundColor: color }}
                onClick={() => onChange({ pageColor: color })}
                aria-label={`Use page color ${color}`}
                title={color.toUpperCase()}
              >
                {appearance.pageColor.toLowerCase() === color && (
                  <Check size={11} aria-hidden="true" />
                )}
              </button>
            ))}
            <label title="Choose custom page color">
              <CirclePlus size={17} aria-hidden="true" />
              <input
                type="color"
                value={appearance.pageColor}
                onChange={(event) =>
                  onChange({ pageColor: event.target.value })
                }
                aria-label="Custom page color"
              />
            </label>
          </div>
        </div>
      </div>
    </details>
  );
}

function ColorVariantDropdown({
  label,
  value,
  colors,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  colors: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const pickFromScreen = async () => {
    const EyeDropperConstructor = (
      window as typeof window & {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
      }
    ).EyeDropper;
    if (!EyeDropperConstructor) return;
    try {
      const result = await new EyeDropperConstructor().open();
      onChange(result.sRGBHex);
    } catch {
      // Closing the native picker is not an error for the editor.
    }
  };

  return (
    <details
      className={`guest-color-dropdown ${disabled ? "is-disabled" : ""}`}
    >
      <summary
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) event.preventDefault();
        }}
      >
        <span
          className="guest-color-dot"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        {label}
        <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div className="guest-color-menu">
        <div className="guest-color-variants">
          {colors.map((color) => (
            <button
              type="button"
              key={color}
              className={value.toLowerCase() === color ? "is-active" : ""}
              style={{ backgroundColor: color }}
              aria-label={`Use color ${color}`}
              title={color.toUpperCase()}
              onClick={(event) => {
                onChange(color);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
            >
              {value.toLowerCase() === color && (
                <Check size={11} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
        <div className="guest-color-custom">
          <strong>Custom</strong>
          <span className="guest-color-custom-actions">
            <span
              className="guest-color-current"
              style={{ backgroundColor: value }}
              aria-label={`Current color ${value}`}
            />
            <label title={`Choose custom ${label.toLowerCase()}`}>
              <CirclePlus size={17} aria-hidden="true" />
              <input
                type="color"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label={`Custom ${label.toLowerCase()}`}
              />
            </label>
            <button
              type="button"
              onClick={() => void pickFromScreen()}
              title="Pick a color from the screen"
              aria-label="Pick a color from the screen"
            >
              <Pipette size={16} />
            </button>
          </span>
        </div>
      </div>
    </details>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={active ? "is-active" : ""}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
