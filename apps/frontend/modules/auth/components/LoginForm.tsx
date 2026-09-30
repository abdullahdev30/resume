"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
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
    void handleLogin({ email, password });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue building your profile.">
      <form className="form-stack" onSubmit={onSubmit}>
        {(formError || error) && <Alert variant="error">{formError || error}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
        />
        <PasswordField
          label="Password"
          value={password}
          autoComplete="current-password"
          required
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
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
