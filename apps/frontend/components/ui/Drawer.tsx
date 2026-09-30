"use client";

import { X } from "lucide-react";
import type React from "react";
import { useEffect, useId } from "react";

export function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close drawer" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="Close drawer">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
      </aside>
    </>
  );
}
