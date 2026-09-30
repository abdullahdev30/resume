export interface User {
  id: string;
  name?: string | null;
  email: string;
  number?: string | null;
  email_verified?: boolean | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyRecoveryOtpPayload {
  email: string;
  otp: string;
}

export interface ChangePasswordPayload {
  new_password: string;
  confirm_new_password: string;
  recovery_code?: string;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterResponse extends MessageResponse {
  email: string;
  email_verification_required: boolean;
}

export interface VerifyEmailResponse extends MessageResponse {
  user: User;
}

export interface TokenResponse {
  message: string;
  access_token: string;
  refresh_token: string;
}

export interface RecoveryCodeResponse {
  message: string;
  recovery_code: string;
}
