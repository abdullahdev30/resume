import type React from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow && <div className="page-eyebrow">{icon}{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
