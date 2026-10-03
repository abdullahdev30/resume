"use client";

import type React from "react";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { PhoneInput } from "../../../components/ui/PhoneInput";
import { ValidatedInput } from "../../../components/ui/ValidatedInput";
import {
  normalizeEmail,
  normalizePlainText,
  validateEmail,
  validateName,
} from "../../../lib/validation";
import { isStrongPassword, passwordsMatch } from "../schemas";
import type { RegisterPayload } from "../types";
import { PasswordField } from "./PasswordField";

export function RegistrationFieldsForm({
  onSubmit,
  loading,
  error,
  submitLabel = "Sign up",
  loadingLabel = "Creating account...",
  footer,
  initialValues,
}: {
  onSubmit: (payload: RegisterPayload) => void | Promise<void>;
  loading: boolean;
  error?: string | null;
  submitLabel?: string;
  loadingLabel?: string;
  footer?: React.ReactNode;
  initialValues?: Partial<RegisterPayload>;
}) {
  const [form, setForm] = useState<RegisterPayload>({
    name: initialValues?.name || "",
    email: initialValues?.email || "",
    phone: initialValues?.phone || "",
    password: "",
    confirm_password: "",
  });
  const [formError, setFormError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({ password: "", confirmation: "" });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirm_password) {
      setFormError("Fill in every required field.");
      return;
    }
    if (!passwordsMatch(form.password, form.confirm_password)) {
      setPasswordErrors({ password: "", confirmation: "Passwords do not match." });
      setFormError("");
      return;
    }
    if (!isStrongPassword(form.password)) {
      setPasswordErrors({ password: "Password must meet every rule below.", confirmation: "" });
      setFormError("");
      return;
    }
    setPasswordErrors({ password: "", confirmation: "" });
    setFormError("");
    void onSubmit({
      ...form,
      name: normalizePlainText(form.name, 100),
      email: normalizeEmail(form.email),
    });
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      {(formError || error) && <Alert variant="error">{formError || error}</Alert>}
      <ValidatedInput
        label="Full name"
        autoComplete="name"
        autoFocus
        required
        value={form.name}
        onValueChange={(name) => setForm({ ...form, name })}
        validate={(name) => validateName(name, "Full name")}
        normalize={(name) => normalizePlainText(name, 100)}
        placeholder="John Doe"
        maxLength={100}
      />
      <ValidatedInput
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={form.email}
        onValueChange={(email) => setForm({ ...form, email })}
        validate={validateEmail}
        normalize={normalizeEmail}
        placeholder="user@example.com"
        maxLength={254}
      />
      <PhoneInput
        label="Phone number"
        required
        value={form.phone}
        onValueChange={(phone) => setForm({ ...form, phone })}
      />
      <PasswordField
        label="Password"
        value={form.password}
        autoComplete="new-password"
        required
        onChange={(event) => setForm({ ...form, password: event.target.value })}
        placeholder="Create a password"
        showChecklist
        minLength={8}
        maxLength={128}
        error={passwordErrors.password}
      />
      <PasswordField
        label="Confirm password"
        value={form.confirm_password}
        autoComplete="new-password"
        required
        onChange={(event) => {
          setForm({ ...form, confirm_password: event.target.value });
          if (passwordErrors.confirmation) {
            setPasswordErrors({ ...passwordErrors, confirmation: "" });
          }
        }}
        placeholder="Repeat your password"
        minLength={8}
        maxLength={128}
        error={passwordErrors.confirmation}
      />
      <Button type="submit" loading={loading} loadingLabel={loadingLabel} fullWidth>
        {submitLabel}
      </Button>
      {footer}
    </form>
  );
}
