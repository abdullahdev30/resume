import type React from "react";
import { useId } from "react";
import { FormField } from "./FormField";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  showCount?: boolean;
};

export function Textarea({
  label,
  hint,
  error,
  optional,
  id,
  className = "",
  showCount = false,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  const valueLength = typeof props.value === "string" ? props.value.length : 0;
  const countHint = showCount && props.maxLength
    ? `${valueLength}/${props.maxLength}${hint ? ` · ${hint}` : ""}`
    : hint;

  return (
    <FormField id={textareaId} label={label} hint={countHint} error={error} optional={optional}>
      <textarea
        id={textareaId}
        className={["field-control", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : countHint ? `${textareaId}-hint` : undefined}
        {...props}
      />
    </FormField>
  );
}
