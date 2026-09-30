import type React from "react";
import { useId } from "react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, id, className = "", ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <label className={["choice-row", className].filter(Boolean).join(" ")} htmlFor={checkboxId}>
      <input type="checkbox" id={checkboxId} {...props} />
      <span>
        <span>{label}</span>
        {description && <span className="field-hint block">{description}</span>}
      </span>
    </label>
  );
}
