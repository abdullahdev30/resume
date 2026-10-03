import {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  VerifyRecoveryOtpPayload,
  ChangePasswordPayload,
  MessageResponse,
  RegisterResponse,
  VerifyEmailResponse,
  RecoveryCodeResponse,
  SessionResponse,
  User,
  GuestUpgradePayload,
  GuestUpgradeVerifyPayload,
} from "./types";

import { apiClient } from "../../lib/api-client";

export const authApi = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiClient("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  async login(payload: LoginPayload): Promise<SessionResponse> {
    return apiClient("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  async createGuest(): Promise<SessionResponse> {
    return apiClient("/auth/guest", {
      method: "POST",
    });
  },

  async requestGuestUpgrade(
    payload: GuestUpgradePayload,
  ): Promise<MessageResponse> {
    return apiClient("/auth/guest/upgrade/request", {
      method: "POST",
      body: payload,
    });
  },

  async verifyGuestUpgrade(
    payload: GuestUpgradeVerifyPayload,
  ): Promise<SessionResponse> {
    return apiClient("/auth/guest/upgrade/verify", {
      method: "POST",
      body: payload,
    });
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
    return apiClient("/auth/verify-email", {
      method: "POST",
      body: payload,
    });
  },

  async resendVerification(
    payload: ResendVerificationPayload,
  ): Promise<MessageResponse> {
    return apiClient("/auth/resend-verification", {
      method: "POST",
      body: payload,
    });
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    return apiClient("/auth/forgot-password", {
      method: "POST",
      body: payload,
    });
  },

  async verifyRecoveryOtp(
    payload: VerifyRecoveryOtpPayload,
  ): Promise<RecoveryCodeResponse> {
    return apiClient("/auth/verify-recovery-otp", {
      method: "POST",
      body: payload,
    });
  },

  async changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
    return apiClient("/auth/change-password", {
      method: "POST",
      body: payload,
    });
  },

  async me(): Promise<User> {
    return apiClient("/auth/me", {
      method: "GET",
    });
  },

  async refresh(): Promise<SessionResponse> {
    return apiClient("/auth/refresh", {
      method: "POST",
    });
  },

  async logout(): Promise<MessageResponse> {
    return apiClient("/auth/logout", {
      method: "POST",
    });
  },
};
