"use client";

import type { InputProps } from "./Input";
import { ValidatedInput } from "./ValidatedInput";
import { normalizeUrl, validateUrl } from "../../lib/validation";

type ValidatedUrlInputProps = Omit<InputProps, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
  platform?: string;
};

export function ValidatedUrlInput({ value, onValueChange, platform, required, ...props }: ValidatedUrlInputProps) {
  return (
    <ValidatedInput
      {...props}
      type="text"
      inputMode="url"
      autoCapitalize="none"
      spellCheck={false}
      value={value}
      onValueChange={onValueChange}
      required={required}
      validate={(current) => validateUrl(current, { required, platform })}
      normalize={normalizeUrl}
      successMessage="Valid URL"
    />
  );
}
