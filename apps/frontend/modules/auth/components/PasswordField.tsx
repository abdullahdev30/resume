"use client";

import { useMemo, useState } from "react";

import { Input, type InputProps } from "../../../components/ui/Input";

type PasswordFieldProps = Omit<InputProps, "type" | "trailing"> & {
  showChecklist?: boolean;
};

export function PasswordField({
  value,
  showChecklist = false,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const password = String(value || "");
  const checks = useMemo(
    () => [
      { label: "8-128 characters", met: password.length >= 8 && password.length <= 128 },
      { label: "Uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Lowercase letter", met: /[a-z]/.test(password) },
      { label: "Number", met: /\d/.test(password) },
      { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  return (
    <div className="form-stack">
      <Input
        {...props}
        value={value}
        type={visible ? "text" : "password"}
        trailing={
          <button
            className="password-toggle"
            type="button"
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        }
      />
      {showChecklist && (
        <ul className="password-checklist">
          {checks.map((check) => (
            <li key={check.label} className={check.met ? "is-met" : undefined}>
              {check.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
