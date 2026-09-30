"use client";

import type React from "react";
import { useEffect, useRef } from "react";

export function Dropdown({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, open]);

  if (!open) return null;
  return <div ref={ref} className={["dropdown", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function DropdownItem({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={["dropdown-item", className].filter(Boolean).join(" ")} {...props} />;
}
