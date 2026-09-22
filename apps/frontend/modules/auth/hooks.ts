"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { AUTH_EMAIL_STORAGE_KEY } from "./constants";
import {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  VerifyRecoveryOtpPayload,
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
      const status = await authApi.onboardingStatus().catch(() => null);
      router.push(status?.personal_completed ? "/dashboard" : "/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.startsWith("Too many attempts")
          ? message
          : "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(payload);
      localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, payload.email);
      router.push("/auth/verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || "";
      await authApi.verifyEmail({ email, otp });
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || "";
      await authApi.resendVerification({ email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (payload: ForgotPasswordPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(payload);
      localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, payload.email);
      router.push("/auth/verify-otp-recovery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start recovery");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecoveryOtp = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || "";
      await authApi.verifyRecoveryOtp({ email, otp });
      router.push("/auth/change-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (payload: ChangePasswordPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.changePassword(payload);
      router.push("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password");
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
