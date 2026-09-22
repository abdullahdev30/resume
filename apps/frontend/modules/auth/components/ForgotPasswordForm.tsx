"use client";

import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../hooks";

const RECOVERY_MESSAGE =
  "If an account exists for this email, recovery instructions have been sent.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { handleForgotPassword, loading, error } = useAuth();

  const submit = async () => {
    setMessage(RECOVERY_MESSAGE);
    await handleForgotPassword({ email });
  };

  return (
    <AuthLayout title="Recover your account" subtitle="Enter your email and we will send recovery instructions.">
      <div className="form-stack">
        {(message || error) && (
          <Alert variant={error ? "error" : "info"}>{error || message}</Alert>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
        />
        <Button type="button" onClick={() => void submit()} loading={loading} disabled={!email}>
          Send recovery code
        </Button>
      </div>
    </AuthLayout>
  );
}
