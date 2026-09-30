"use client";

import { X } from "lucide-react";
import type React from "react";
import { useEffect, useId, useRef } from "react";

export type DialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  closeOnOutside?: boolean;
  preventClose?: boolean;
  className?: string;
};

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  closeOnOutside = true,
  preventClose = false,
  className = "",
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelector<HTMLElement>("[autofocus]")
      || panelRef.current?.querySelector<HTMLElement>(
        "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
      )
      || panelRef.current?.querySelector<HTMLElement>("button:not([disabled]), a[href]");
    focusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !preventClose) onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open, preventClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnOutside && !preventClose) onClose();
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : "Dialog"}
        className={["dialog-panel", className].filter(Boolean).join(" ")}
      >
        {(title || !preventClose) && (
          <header className="dialog-header">
            <div>
              {title && <h2 id={titleId}>{title}</h2>}
              {description && <p className="dialog-description" id={descriptionId}>{description}</p>}
            </div>
            {!preventClose && (
              <button type="button" className="dialog-close" onClick={onClose} aria-label="Close dialog">
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </header>
        )}
        <div className="dialog-body">{children}</div>
      </section>
    </div>
  );
}
