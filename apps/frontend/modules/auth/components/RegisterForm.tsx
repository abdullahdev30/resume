"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { PhoneInput } from "../../../components/ui/PhoneInput";
import { ValidatedInput } from "../../../components/ui/ValidatedInput";
import { normalizeEmail, normalizePlainText, validateEmail, validateName } from "../../../lib/validation";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import { isStrongPassword, passwordsMatch } from "../schemas";
import { useAuth } from "../hooks";

export function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [formError, setFormError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({ password: "", confirmation: "" });
  const { handleRegister, loading, error } = useAuth();

  const onSubmit = (event: React.FormEvent) => {
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
    void handleRegister({
      ...form,
      name: normalizePlainText(form.name, 100),
      email: normalizeEmail(form.email),
    });
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start with the essentials. You can finish the resume details next.">
      <form className="form-stack" onSubmit={onSubmit}>
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
            if (passwordErrors.confirmation) setPasswordErrors({ ...passwordErrors, confirmation: "" });
          }}
          placeholder="Repeat your password"
          minLength={8}
          maxLength={128}
          error={passwordErrors.confirmation}
        />
        <Button type="submit" loading={loading} loadingLabel="Creating account..." fullWidth>
          Sign up
        </Button>
        <p>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-link">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
