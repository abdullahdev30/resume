"use client";

import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { OtpInput } from "./OtpInput";
import { useAuth } from "../hooks";

export function VerifyEmailForm() {
  const [otp, setOtp] = useState("");
  const { handleVerifyEmail, handleResendOtp, loading, error } = useAuth();

  const submit = (code = otp) => {
    if (code.length === 6) {
      void handleVerifyEmail(code);
    }
  };

  return (
    <AuthLayout title="Verify your email" subtitle="Enter the 6-digit code sent to your email.">
      <div className="form-stack">
        {error && <Alert variant="error">{error}</Alert>}
        <OtpInput value={otp} onChange={setOtp} onComplete={submit} />
        <Button type="button" onClick={() => submit()} loading={loading} loadingLabel="Verifying..." disabled={otp.length !== 6} fullWidth>
          Verify code
        </Button>
        <Button type="button" onClick={() => void handleResendOtp()} variant="ghost" disabled={loading}>
          Resend code
        </Button>
      </div>
    </AuthLayout>
  );
}
