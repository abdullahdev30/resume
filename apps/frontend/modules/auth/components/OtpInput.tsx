"use client";

import { useRef } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
};

export function OtpInput({ value, onChange, onComplete }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  function update(nextValue: string, index: number) {
    const sanitized = nextValue.replace(/\D/g, "").slice(0, 6);
    const current = value.padEnd(6, " ").slice(0, 6).split("");

    if (sanitized.length > 1) {
      onChange(sanitized);
      if (sanitized.length === 6) {
        onComplete?.(sanitized);
      }
      return;
    }

    current[index] = sanitized || " ";
    const joined = current.join("").replace(/\s/g, "");
    onChange(joined);
    if (sanitized && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    if (joined.length === 6) {
      onComplete?.(joined);
    }
  }

  return (
    <div className="otp-row">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          className="field-control otp-input"
          value={digit.trim()}
          inputMode="numeric"
          autoFocus={index === 0}
          autoComplete={index === 0 ? "one-time-code" : undefined}
          aria-label={`Digit ${index + 1}`}
          maxLength={1}
          onChange={(event) => update(event.target.value, index)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit.trim() && index > 0) {
              inputs.current[index - 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
