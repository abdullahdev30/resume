import type React from "react";
import { useId } from "react";
import { FormField } from "./FormField";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function Textarea({
  label,
  hint,
  error,
  optional,
  id,
  className = "",
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <FormField id={textareaId} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={textareaId}
        className={["field-control", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
    </FormField>
  );
}
