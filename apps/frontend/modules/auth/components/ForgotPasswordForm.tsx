"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { ValidatedInput } from "../../../components/ui/ValidatedInput";
import { normalizeEmail, validateEmail } from "../../../lib/validation";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../hooks";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const { handleForgotPassword, loading, error } = useAuth();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await handleForgotPassword({ email: normalizeEmail(email) });
  };

  return (
    <AuthLayout title="Recover your account" subtitle="Enter your email and we will send recovery instructions.">
      <form className="form-stack" onSubmit={submit}>
        {error && <Alert variant="error">{error}</Alert>}
        <ValidatedInput
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onValueChange={setEmail}
          validate={validateEmail}
          normalize={normalizeEmail}
          placeholder="user@example.com"
          maxLength={254}
        />
        <Button type="submit" loading={loading} loadingLabel="Sending..." disabled={!email} fullWidth>
          Send recovery code
        </Button>
        <Link href="/auth/login" className="text-link text-center">Back to sign in</Link>
      </form>
    </AuthLayout>
  );
}
