export interface User {
  id: string;
  name: string;
  email: string;
  number?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  number: string;
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
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  message?: string;
  user?: User;
}