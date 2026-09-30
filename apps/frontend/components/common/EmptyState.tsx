import { FileText } from "lucide-react";
import type React from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="state-panel">
      <div className="state-panel-inner">
        <div className="state-icon">{icon || <FileText size={22} aria-hidden="true" />}</div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {action}
      </div>
    </section>
  );
}
