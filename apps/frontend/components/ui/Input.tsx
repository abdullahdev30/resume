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
  inputRef?: React.Ref<HTMLInputElement>;
  showCount?: boolean;
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
  inputRef,
  showCount = false,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  const valueLength = typeof props.value === "string" ? props.value.length : 0;
  const countHint = showCount && props.maxLength
    ? `${valueLength}/${props.maxLength}${hint ? ` - ${hint}` : ""}`
    : hint;
  const countHintId = countHint ? `${inputId}-hint` : undefined;
  const describedBy = error ? errorId : countHintId;

  return (
    <FormField id={inputId} label={label} hint={countHint} error={error} optional={optional}>
      <div className="field-control-wrap">
        {leading && <div className="field-leading">{leading}</div>}
        <input
          ref={inputRef}
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
