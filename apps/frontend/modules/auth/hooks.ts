"use client";

import { useRef, useState } from "react";
import { ApiClientError } from "@/lib/api-client";
import {
  readAuthState,
  writeAuthState,
  removeAuthState,
  safeAuthDestination,
} from "./session";
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
  const pending = useRef(false);

  const handleLogin = async (payload: LoginPayload) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      await authApi.login(payload);
      toast.success("Welcome back. Your workspace is ready.");
      removeAuthState(AUTH_RECOVERY_CODE_STORAGE_KEY);
      router.replace(
        safeAuthDestination(
          new URLSearchParams(window.location.search).get("next"),
        ),
      );
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (err instanceof ApiClientError && err.code === "email_not_confirmed") {
        writeAuthState(AUTH_EMAIL_STORAGE_KEY, payload.email);
        toast.info(
          "Verify your email to finish signing in. You can request a new code below.",
        );
        router.push("/auth/verify-email");
        return;
      }
      const friendlyMessage =
        err instanceof ApiClientError && err.status === 401
          ? "Invalid email or password."
          : message || "Unable to sign in. Please try again.";
      setError(friendlyMessage);
      toast.error(friendlyMessage, "Unable to sign in");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const registration = await authApi.register(payload);
      writeAuthState(AUTH_EMAIL_STORAGE_KEY, registration.email);
      toast.success(registration.message);
      router.replace("/auth/verify-email");
    } catch (err) {
      const message = err instanceof ApiClientError && err.status === 502
        ? err.code === "backend_unavailable"
          ? "The registration API could not be reached. Check BACKEND_API_URL and make sure the backend is running."
          : "The authentication provider could not complete registration. Check that email sign-ups and verification email delivery are enabled in Supabase Auth."
        :
        err instanceof Error ? err.message : "Registration failed.";
      setError(message);
      toast.error(message, "Unable to create account");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (otp: string, suppliedEmail?: string) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const email = suppliedEmail || readAuthState(AUTH_EMAIL_STORAGE_KEY);
      if (!email) throw new Error("Enter your email address first.");
      writeAuthState(AUTH_EMAIL_STORAGE_KEY, email);
      await authApi.verifyEmail({ email, otp });
      toast.success("Email verified successfully.");
      removeAuthState(AUTH_EMAIL_STORAGE_KEY);
      router.replace("/packages");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Email verification failed.";
      setError(message);
      toast.error(message, "Verification failed");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const handleResendOtp = async (suppliedEmail?: string) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const email = suppliedEmail || readAuthState(AUTH_EMAIL_STORAGE_KEY);
      if (!email) throw new Error("Enter your email address first.");
      writeAuthState(AUTH_EMAIL_STORAGE_KEY, email);
      await authApi.resendVerification({ email });
      toast.success("A new verification code has been sent.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to resend the code.";
      setError(message);
      toast.error(message);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const handleForgotPassword = async (payload: ForgotPasswordPayload) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(payload);
      removeAuthState(AUTH_RECOVERY_CODE_STORAGE_KEY);
      writeAuthState(AUTH_EMAIL_STORAGE_KEY, payload.email);
      toast.info(
        "If an account exists for this email, a recovery code has been sent.",
      );
      router.push("/auth/verify-otp-recovery");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to start recovery.";
      setError(message);
      toast.error(message);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const handleVerifyRecoveryOtp = async (
    otp: string,
    suppliedEmail?: string,
  ) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const email = suppliedEmail || readAuthState(AUTH_EMAIL_STORAGE_KEY);
      if (!email) throw new Error("Enter your email address first.");
      writeAuthState(AUTH_EMAIL_STORAGE_KEY, email);
      const response = await authApi.verifyRecoveryOtp({ email, otp });
      writeAuthState(AUTH_RECOVERY_CODE_STORAGE_KEY, response.recovery_code);
      toast.success("Recovery code verified.");
      router.push("/auth/change-password");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Recovery verification failed.";
      setError(message);
      toast.error(message);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const handleChangePassword = async (payload: ChangePasswordPayload) => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const recoveryCode =
        payload.recovery_code ||
        readAuthState(AUTH_RECOVERY_CODE_STORAGE_KEY) ||
        undefined;
      await authApi.changePassword({
        ...payload,
        recovery_code: recoveryCode,
      });
      removeAuthState(AUTH_EMAIL_STORAGE_KEY);
      removeAuthState(AUTH_RECOVERY_CODE_STORAGE_KEY);
      toast.success("Password updated. You can now sign in.");
      router.push("/auth/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to change password.";
      setError(message);
      toast.error(message);
    } finally {
      pending.current = false;
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
