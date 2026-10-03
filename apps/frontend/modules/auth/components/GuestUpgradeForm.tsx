"use client";

import { CheckCircle2, MailCheck } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authApi } from "@/modules/auth/api";
import type { RegisterPayload } from "@/modules/auth/types";

import { OtpInput } from "./OtpInput";
import { RegistrationFieldsForm } from "./RegistrationFieldsForm";

export function GuestUpgradeForm({
  initialName,
  initialEmail,
  initialPhone,
}: {
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
}) {
  const [pendingPayload, setPendingPayload] = useState<RegisterPayload | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async (payload: RegisterPayload) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await authApi.requestGuestUpgrade(payload);
      setPendingPayload(payload);
      setOtp("");
      toast.success(result.message);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to send a verification code.";
      setError(message);
      toast.error(message, "Conversion could not start");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code = otp) => {
    if (!pendingPayload || code.length !== 6 || loading) return;
    setLoading(true);
    setError("");
    try {
      await authApi.verifyGuestUpgrade({ ...pendingPayload, otp: code });
      toast.success("Your guest data is now protected by a permanent account.");
      window.location.assign("/settings");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to verify the code.";
      setError(message);
      toast.error(message, "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card id="convert-account" padding="lg" className="lg:col-span-2 scroll-mt-24">
      <div className="mb-5 flex items-start gap-3">
        <span className="state-icon !h-10 !w-10"><CheckCircle2 size={19} aria-hidden="true" /></span>
        <div>
          <h2 className="text-lg font-bold">Keep this guest account permanently</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Add your details and verify your email before the 12-hour session ends. Your current profile and resumes stay on this same account.
          </p>
        </div>
      </div>

      {!pendingPayload ? (
        <RegistrationFieldsForm
          initialValues={{ name: initialName, email: initialEmail, phone: initialPhone }}
          onSubmit={requestCode}
          loading={loading}
          error={error}
          submitLabel="Send verification code"
          loadingLabel="Sending code..."
        />
      ) : (
        <div className="form-stack">
          {error && <Alert variant="error">{error}</Alert>}
          <Alert variant="info">
            <span className="inline-flex items-center gap-2">
              <MailCheck size={16} aria-hidden="true" />
              Enter the 6-digit code sent to {pendingPayload.email}.
            </span>
          </Alert>
          <OtpInput value={otp} onChange={setOtp} onComplete={(code) => void verify(code)} />
          <Button
            type="button"
            onClick={() => void verify()}
            loading={loading}
            loadingLabel="Verifying account..."
            disabled={otp.length !== 6}
            fullWidth
          >
            Verify email and keep account
          </Button>
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setPendingPayload(null)} disabled={loading}>
              Change details
            </Button>
            <Button type="button" variant="ghost" onClick={() => void requestCode(pendingPayload)} disabled={loading}>
              Resend code
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
