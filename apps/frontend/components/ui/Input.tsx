import type React from "react";
import { useId } from "react";
import { FormField } from "./FormField";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  optional?: boolean;
}

export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  leading,
  trailing,
  optional,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = error ? errorId : hintId;

  return (
    <FormField id={inputId} label={label} hint={hint} error={error} optional={optional}>
      <div className="field-control-wrap">
        {leading && <div className="field-leading">{leading}</div>}
        <input
          id={inputId}
          className={[
            "field-control",
            leading ? "has-leading" : "",
            trailing ? "has-trailing" : "",
            className,
          ].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {trailing && <div className="field-trailing">{trailing}</div>}
      </div>
    </FormField>
  );
}
