import type React from "react";
import { useId } from "react";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Radio({ label, id, className = "", ...props }: RadioProps) {
  const generatedId = useId();
  const radioId = id || generatedId;

  return (
    <label className={["choice-row", className].filter(Boolean).join(" ")} htmlFor={radioId}>
      <input id={radioId} type="radio" {...props} />
      <span>{label}</span>
    </label>
  );
}
