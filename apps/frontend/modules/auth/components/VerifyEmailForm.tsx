"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { OtpInput } from "./OtpInput";
import { useAuth } from "../hooks";
import { readAuthState } from "../session";
import { AUTH_EMAIL_STORAGE_KEY } from "../constants";
import { ValidatedInput } from "@/components/ui/ValidatedInput";
import { normalizeEmail, validateEmail } from "@/lib/validation";

export function VerifyEmailForm() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    setEmail(readAuthState(AUTH_EMAIL_STORAGE_KEY));
  }, []);
  const { handleVerifyEmail, handleResendOtp, loading, error } = useAuth();

  const submit = (code = otp) => {
    if (/^\d{6}$/.test(code) && !loading && !validateEmail(email)) {
      void handleVerifyEmail(code, normalizeEmail(email));
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code sent to your email."
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {error && <Alert variant="error">{error}</Alert>}
        <ValidatedInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onValueChange={(value) => {
            setEmail(value);
            setOtp("");
          }}
          validate={validateEmail}
          normalize={normalizeEmail}
          maxLength={254}
        />
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        <Button
          type="submit"
          loading={loading}
          loadingLabel="Verifying..."
          disabled={!/^\d{6}$/.test(otp) || Boolean(validateEmail(email))}
          fullWidth
        >
          Verify code
        </Button>
        <Button
          type="button"
          onClick={() => void handleResendOtp(normalizeEmail(email))}
          variant="ghost"
          disabled={loading || Boolean(validateEmail(email))}
        >
          Resend code
        </Button>
        <Link href="/auth/login" className="text-link text-center">
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
