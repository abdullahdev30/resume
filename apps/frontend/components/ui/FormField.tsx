import type React from "react";

export interface FormFieldProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={["field", className].filter(Boolean).join(" ")}>
      {label && (
        <div className="field-label-row">
          <label className="field-label" htmlFor={id}>
            {label}
          </label>
          {optional && <span className="field-optional">Optional</span>}
        </div>
      )}
      {children}
      {hint && !error && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
