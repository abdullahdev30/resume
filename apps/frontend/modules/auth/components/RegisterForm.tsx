"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../hooks";
import { authApi } from "../api";
import type { RegisterPayload } from "../types";
import { RegistrationFieldsForm } from "./RegistrationFieldsForm";
import { OtpInput } from "./OtpInput";

export function RegisterForm({ isGuestUpgrade = false }: { isGuestUpgrade?: boolean }) {
  const { handleRegister, loading, error } = useAuth();
  const router = useRouter();
  const [upgradePayload, setUpgradePayload] = useState<RegisterPayload | null>(null);
  const [otp, setOtp] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  const requestUpgrade = async (payload: RegisterPayload) => {
    if (!isGuestUpgrade) {
      await handleRegister(payload);
      return;
    }
    setUpgradeLoading(true);
    setUpgradeError("");
    try {
      const response = await authApi.requestGuestUpgrade(payload);
      setUpgradePayload(payload);
      toast.success(response.message);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to start account conversion.";
      setUpgradeError(message);
      toast.error(message, "Account conversion failed");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const verifyUpgrade = async (code = otp) => {
    if (!upgradePayload || code.length !== 6 || upgradeLoading) return;
    setUpgradeLoading(true);
    setUpgradeError("");
    try {
      await authApi.verifyGuestUpgrade({ ...upgradePayload, otp: code });
      toast.success("Your account is ready and your guest resumes were preserved.");
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to verify the account conversion.";
      setUpgradeError(message);
      toast.error(message, "Verification failed");
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (upgradePayload) {
    return (
      <AuthLayout
        title="Keep your guest resumes"
        subtitle={`Enter the 6-digit code sent to ${upgradePayload.email}.`}
      >
        <div className="form-stack">
          {upgradeError && <Alert variant="error">{upgradeError}</Alert>}
          <OtpInput value={otp} onChange={setOtp} onComplete={(code) => void verifyUpgrade(code)} />
          <Button
            type="button"
            onClick={() => void verifyUpgrade()}
            loading={upgradeLoading}
            loadingLabel="Verifying..."
            disabled={otp.length !== 6}
            fullWidth
          >
            Verify and save account
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={upgradeLoading}
            onClick={() => void requestUpgrade(upgradePayload)}
          >
            Resend code
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isGuestUpgrade ? "Save your guest workspace" : "Create your account"}
      subtitle={isGuestUpgrade
        ? "Convert this guest session to a permanent account without losing its resumes."
        : "Start with the essentials. You can finish the resume details next."}
    >
      <RegistrationFieldsForm
        onSubmit={requestUpgrade}
        loading={loading || upgradeLoading}
        error={error || upgradeError}
        submitLabel={isGuestUpgrade ? "Save guest workspace" : "Sign up"}
        loadingLabel={isGuestUpgrade ? "Sending verification code..." : "Creating account..."}
        footer={<p>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-link">
            Log in
          </Link>
        </p>}
      />
    </AuthLayout>
  );
}
