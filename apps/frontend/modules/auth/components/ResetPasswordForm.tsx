"use client";

import type React from "react";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import { isStrongPassword, passwordsMatch } from "../schemas";
import { useAuth } from "../hooks";

export function ResetPasswordForm() {
  const [form, setForm] = useState({
    new_password: "",
    confirm_new_password: "",
  });
  const [formError, setFormError] = useState("");
  const { handleChangePassword, loading, error } = useAuth();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordsMatch(form.new_password, form.confirm_new_password)) {
      setFormError("New passwords do not match.");
      return;
    }
    if (!isStrongPassword(form.new_password)) {
      setFormError("Password must meet every rule below.");
      return;
    }
    setFormError("");
    void handleChangePassword(form);
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to finish account recovery.">
      <form className="form-stack" onSubmit={onSubmit}>
        {(formError || error) && <Alert variant="error">{formError || error}</Alert>}
        <PasswordField
          label="New password"
          value={form.new_password}
          autoComplete="new-password"
          autoFocus
          required
          onChange={(event) => setForm({ ...form, new_password: event.target.value })}
          placeholder="Create a new password"
          showChecklist
        />
        <PasswordField
          label="Confirm new password"
          value={form.confirm_new_password}
          autoComplete="new-password"
          required
          onChange={(event) => setForm({ ...form, confirm_new_password: event.target.value })}
          placeholder="Repeat your new password"
        />
        <Button type="submit" loading={loading} loadingLabel="Updating password..." fullWidth>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
