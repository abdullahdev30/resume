"use client";

import { useEffect, useRef, useState } from "react";

import { Input, type InputProps } from "./Input";

type ValidatedInputProps = Omit<InputProps, "value" | "onChange" | "onBlur" | "onInvalid" | "error" | "inputRef"> & {
  value: string;
  onValueChange: (value: string) => void;
  validate: (value: string) => string | null;
  normalize?: (value: string) => string;
  successMessage?: string;
};

export function ValidatedInput({
  value,
  onValueChange,
  validate,
  normalize = (current) => current.trim(),
  successMessage,
  ...props
}: ValidatedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const error = validate(value);
  const visibleError = touched ? error || undefined : undefined;
  const valid = touched && Boolean(value.trim()) && !error;

  useEffect(() => {
    inputRef.current?.setCustomValidity(error || "");
  }, [error]);

  return (
    <Input
      {...props}
      inputRef={inputRef}
      value={value}
      error={visibleError}
      trailing={valid ? <span className="field-valid" aria-label={successMessage || "Valid"}>✓</span> : props.trailing}
      onChange={(event) => onValueChange(event.target.value)}
      onBlur={() => {
        const normalized = normalize(value);
        if (normalized !== value) onValueChange(normalized);
        setTouched(true);
      }}
      onInvalid={(event) => {
        event.preventDefault();
        setTouched(true);
      }}
    />
  );
}
