"use client";

import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { toast } from "../../../components/feedback/Toast";
import { Button } from "../../../components/ui/Button";
import { ValidatedInput } from "../../../components/ui/ValidatedInput";
import { normalizeEmail, validateEmail } from "../../../lib/validation";
import { authApi } from "../api";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import { useAuth } from "../hooks";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");
  const router = useRouter();
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

  const continueAsGuest = async () => {
    setGuestLoading(true);
    setGuestError("");
    try {
      await authApi.createGuest();
      toast.success("Your 12-hour guest workspace is ready.");
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error
        ? caught.message
        : "The guest session could not be started. Please try again.";
      setGuestError(message);
      toast.error(message, "Guest session failed");
    } finally {
      setGuestLoading(false);
    }
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
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--border)]" /> or <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        {guestError && <Alert variant="error">{guestError}</Alert>}
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => void continueAsGuest()}
          loading={guestLoading}
          loadingLabel="Starting guest session..."
          disabled={loading}
        >
          Continue as guest
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
