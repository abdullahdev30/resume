import type React from "react";
import { useId } from "react";
import { FormField } from "./FormField";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function Select({
  label,
  hint,
  error,
  optional,
  id,
  className = "",
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <FormField id={selectId} label={label} hint={hint} error={error} optional={optional}>
      <div className="select-wrap">
        <select
          id={selectId}
          className={["field-control", className].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {children}
        </select>
        <span className="select-arrow" aria-hidden="true" />
      </div>
    </FormField>
  );
}
