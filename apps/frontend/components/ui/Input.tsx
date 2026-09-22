import type React from "react";
import { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: React.ReactNode;
}

export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  trailing,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="field-control-wrap">
        <input
          id={inputId}
          className={["field-control", className].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {trailing && <div className="field-trailing">{trailing}</div>}
      </div>
      {hint && (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
