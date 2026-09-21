"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
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
      const authResult = await authApi.login(payload);
      const userState = authResult.user?.id
        ? localStorage.getItem(`onboarding_state:${authResult.user.id}`)
        : null;
      const onboardingState =
        userState || localStorage.getItem("onboarding_state");
      router.push(
        onboardingState === "completed" || onboardingState === "skipped"
          ? "/dashboard"
          : "/onboarding",
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(payload);
      localStorage.setItem("auth_email", payload.email);
      router.push("/auth/verify-email");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem("auth_email") || "";
      await authApi.verifyEmail({ email, otp });
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem("auth_email") || "";
      await authApi.resendVerification({ email });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (payload: ForgotPasswordPayload) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(payload);
      localStorage.setItem("auth_email", payload.email);
      router.push("/auth/verify-otp-recovery");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecoveryOtp = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem("auth_email") || "";
      await authApi.verifyRecoveryOtp({ email, otp });
      router.push("/auth/change-password");
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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
