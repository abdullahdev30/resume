import { 
  LoginPayload, 
  RegisterPayload, 
  VerifyEmailPayload, 
  ResendVerificationPayload, 
  ForgotPasswordPayload, 
  VerifyRecoveryOtpPayload, 
  ChangePasswordPayload, 
  AuthResponse 
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Something went wrong');
  }
  return data;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async resendVerification(payload: ResendVerificationPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async verifyRecoveryOtp(payload: VerifyRecoveryOtpPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/verify-recovery-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async changePassword(payload: ChangePasswordPayload, token: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async logout(token: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },
};