import {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  VerifyRecoveryOtpPayload,
  ChangePasswordPayload,
  AuthResponse,
} from "./types";

import { apiClient } from "../../lib/api-client";

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiClient("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<AuthResponse> {
    return apiClient("/auth/verify-email", {
      method: "POST",
      body: payload,
    });
  },

  async resendVerification(
    payload: ResendVerificationPayload,
  ): Promise<AuthResponse> {
    return apiClient("/auth/resend-verification", {
      method: "POST",
      body: payload,
    });
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<AuthResponse> {
    return apiClient("/auth/forgot-password", {
      method: "POST",
      body: payload,
    });
  },

  async verifyRecoveryOtp(
    payload: VerifyRecoveryOtpPayload,
  ): Promise<AuthResponse> {
    return apiClient("/auth/verify-recovery-otp", {
      method: "POST",
      body: payload,
    });
  },

  async changePassword(payload: ChangePasswordPayload): Promise<AuthResponse> {
    return apiClient("/auth/change-password", {
      method: "POST",
      body: payload,
    });
  },

  async me(): Promise<NonNullable<AuthResponse["user"]>> {
    return apiClient("/auth/me", {
      method: "GET",
    });
  },

  async logout(): Promise<AuthResponse> {
    return apiClient("/auth/logout", {
      method: "POST",
    });
  },

  async onboardingStatus(): Promise<{ personal_completed: boolean }> {
    return apiClient("/profile/onboarding/status", {
      method: "GET",
    });
  },
};

export const AUTH_EMAIL_STORAGE_KEY = "auth_email";