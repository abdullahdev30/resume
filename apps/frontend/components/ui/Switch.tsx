import type React from "react";
import { useId } from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Switch({ label, id, className = "", ...props }: SwitchProps) {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <label className={["switch", className].filter(Boolean).join(" ")} htmlFor={switchId}>
      <input id={switchId} type="checkbox" role="switch" {...props} />
      <span className="switch-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
