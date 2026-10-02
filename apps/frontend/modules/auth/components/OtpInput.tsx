"use client";

import { useRef } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
};

export function OtpInput({ value, onChange, onComplete }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const length = 6;
  const digits = Array.from({ length }, (_, index) => value[index] || "");

  function update(nextValue: string, index: number) {
    const sanitized = nextValue.replace(/\D/gu, "").slice(0, length);
    const current = [...digits];

    if (sanitized.length > 1) {
      applyDigits(sanitized, sanitized.length === length ? 0 : index);
      return;
    }

    current[index] = sanitized;
    const joined = current.join("").slice(0, length);
    onChange(joined);
    if (sanitized && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (joined.length === length) {
      onComplete?.(joined);
    }
  }

  function applyDigits(pastedValue: string, startIndex: number) {
    const pastedDigits = pastedValue.replace(/\D/gu, "").slice(0, length);
    if (!pastedDigits) return;
    const next = startIndex === 0 ? Array<string>(length).fill("") : [...digits];
    pastedDigits.slice(0, length - startIndex).split("").forEach((digit, offset) => {
      next[startIndex + offset] = digit;
    });
    const joined = next.join("").slice(0, length);
    onChange(joined);
    const nextEmpty = next.findIndex((digit, itemIndex) => itemIndex >= startIndex && !digit);
    const focusIndex = nextEmpty >= 0 ? nextEmpty : Math.min(startIndex + pastedDigits.length - 1, length - 1);
    inputs.current[focusIndex]?.focus();
    if (joined.length === length) onComplete?.(joined);
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
          value={digit}
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus={index === 0}
          autoComplete={index === 0 ? "one-time-code" : undefined}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => update(event.target.value, index)}
          onPaste={(event) => {
            event.preventDefault();
            applyDigits(event.clipboardData.getData("text"), index);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault();
              inputs.current[index - 1]?.focus();
            } else if (event.key === "ArrowRight" && index < length - 1) {
              event.preventDefault();
              inputs.current[index + 1]?.focus();
            } else if (event.key === "Backspace" && !digit && index > 0) {
              event.preventDefault();
              const next = [...digits];
              next[index - 1] = "";
              onChange(next.join(""));
              inputs.current[index - 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
