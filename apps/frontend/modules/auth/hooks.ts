"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, AUTH_EMAIL_STORAGE_KEY } from "./api";
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
      const res = await authApi.login(payload);
      const status = await authApi.onboardingStatus().catch(() => null);
      
      const userId = res?.user?.id || "";
      const isDoneLocally = typeof window !== "undefined" && (
        localStorage.getItem(`onboarding_completed:${userId}`) === "true" ||
        localStorage.getItem(`onboarding_skipped:${userId}`) === "true" ||
        localStorage.getItem("onboarding_state") === "completed" ||
        localStorage.getItem("onboarding_state") === "skipped"
      );

      if (status?.personal_completed || isDoneLocally) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
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

  const handleChangePassword = async (payload: Omit<ChangePasswordPayload, "email">) => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY) || "";
      await authApi.changePassword({ ...payload, email });
      localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
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