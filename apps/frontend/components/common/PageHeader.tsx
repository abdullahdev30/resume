import type React from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { t } = useLanguage();
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow && (
          <div className="page-eyebrow">
            {icon}
            {t(eyebrow)}
          </div>
        )}
        <h1>{t(title)}</h1>
        {description && <p>{t(description)}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
