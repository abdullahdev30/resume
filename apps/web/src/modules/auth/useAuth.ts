'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './api';
import { 
  LoginPayload, 
  RegisterPayload, 
  VerifyEmailPayload, 
  ForgotPasswordPayload, 
  VerifyRecoveryOtpPayload, 
  ChangePasswordPayload 
} from './types';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(payload);
      if (data.access_token && data.refresh_token) {
        document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=604800; SameSite=Strict`;
      }
      router.push('/dashboard');
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
      localStorage.setItem('auth_email', payload.email);
      router.push('/auth/verify-email');
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
      const email = localStorage.getItem('auth_email') || '';
      await authApi.verifyEmail({ email, otp });
      router.push('/auth/login');
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
      const email = localStorage.getItem('auth_email') || '';
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
      localStorage.setItem('auth_email', payload.email);
      router.push('/auth/verify-recovery-otp');
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
      const email = localStorage.getItem('auth_email') || '';
      await authApi.verifyRecoveryOtp({ email, otp });
      router.push('/auth/change-password');
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
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';
      await authApi.changePassword(payload, token);
      router.push('/auth/login');
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