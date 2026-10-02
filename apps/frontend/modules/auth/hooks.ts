"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/feedback/Toast";
import { authApi } from "./api";
import {
  AUTH_EMAIL_STORAGE_KEY,
  AUTH_RECOVERY_CODE_STORAGE_KEY,
} from "./constants";
import {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ChangePasswordPayload,
} from "./types";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.login(payload);
      toast.success("Welcome back. Your workspace is ready.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const friendlyMessage = message.startsWith("Too many attempts")
          ? message
          : "Invalid email or password.";
      setError(friendlyMessage);
      toast.error(friendlyMessage, "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const registration = await authApi.register(payload);
      sessionStorage.setItem(AUTH_EMAIL_STORAGE_KEY, registration.email);
      toast.success(registration.message);
      router.replace("/auth/verify-email");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setError(message);
      toast.error(message, "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = sessionStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || "";
      await authApi.verifyEmail({ email, otp });
      toast.success("Email verified successfully.");
      router.push("/settings");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email verification failed.";
      setError(message);
      toast.error(message, "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = sessionStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || "";
      await authApi.resendVerification({ email });
      toast.success("A new verification code has been sent.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to resend the code.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (payload: ForgotPasswordPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(payload);
      sessionStorage.setItem(AUTH_EMAIL_STORAGE_KEY, payload.email);
      toast.info("If an account exists for this email, a recovery code has been sent.");
      router.push("/auth/verify-otp-recovery");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start recovery.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecoveryOtp = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = sessionStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || "";
      const response = await authApi.verifyRecoveryOtp({ email, otp });
      sessionStorage.setItem(
        AUTH_RECOVERY_CODE_STORAGE_KEY,
        response.recovery_code,
      );
      toast.success("Recovery code verified.");
      router.push("/auth/change-password");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Recovery verification failed.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (payload: ChangePasswordPayload) => {
    setLoading(true);
    setError(null);
    try {
      const recoveryCode =
        payload.recovery_code ||
        sessionStorage.getItem(AUTH_RECOVERY_CODE_STORAGE_KEY) ||
        undefined;
      await authApi.changePassword({
        ...payload,
        recovery_code: recoveryCode,
      });
      sessionStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_RECOVERY_CODE_STORAGE_KEY);
      toast.success("Password updated. You can now sign in.");
      router.push("/auth/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to change password.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleLogin,
    handleRegister,
    handleVerifyEmail,
    handleResendOtp,
    handleForgotPassword,
    handleVerifyRecoveryOtp,
    handleChangePassword,
  };
}
