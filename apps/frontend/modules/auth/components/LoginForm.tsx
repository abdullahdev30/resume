"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { ValidatedInput } from "../../../components/ui/ValidatedInput";
import { normalizeEmail, validateEmail } from "../../../lib/validation";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import { useAuth } from "../hooks";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const { handleLogin, loading, error } = useAuth();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setFormError("Enter your email and password.");
      return;
    }
    setFormError("");
    void handleLogin({ email: normalizeEmail(email), password });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue building your profile.">
      <form className="form-stack" onSubmit={onSubmit}>
        {(formError || error) && <Alert variant="error">{formError || error}</Alert>}
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
        <PasswordField
          label="Password"
          value={password}
          autoComplete="current-password"
          required
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          maxLength={128}
        />
        <div className="form-footer">
          <span />
          <Link href="/auth/forgot-password" className="text-link">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} loadingLabel="Signing in..." fullWidth>
          Log in
        </Button>
        <p>
          No account?{" "}
          <Link href="/auth/register" className="text-link">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
