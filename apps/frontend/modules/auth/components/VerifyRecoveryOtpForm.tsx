"use client";

import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { OtpInput } from "./OtpInput";
import { useAuth } from "../hooks";

export function VerifyRecoveryOtpForm() {
  const [otp, setOtp] = useState("");
  const { handleVerifyRecoveryOtp, loading, error } = useAuth();

  const submit = (code = otp) => {
    if (code.length === 6) {
      void handleVerifyRecoveryOtp(code);
    }
  };

  return (
    <AuthLayout title="Verify recovery code" subtitle="Enter the code before choosing a new password.">
      <div className="form-stack">
        {error && <Alert variant="error">{error}</Alert>}
        <OtpInput value={otp} onChange={setOtp} onComplete={submit} />
        <Button type="button" onClick={() => submit()} loading={loading} disabled={otp.length !== 6}>
          Verify recovery code
        </Button>
      </div>
    </AuthLayout>
  );
}
