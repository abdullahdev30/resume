import type React from "react";

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="tooltip-wrap">
      {children}
      <span className="tooltip" role="tooltip">{label}</span>
    </span>
  );
}
