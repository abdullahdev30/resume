'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { useAuth } from '../../../modules/auth/useAuth';

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState('');
  const { handleVerifyEmail, handleResendOtp, loading, error } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '24rem', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Verify Email OTP</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Enter the verification code sent to your registered email.</p>

        {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</span>}

        <Input label="OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />

        <Button onClick={() => handleVerifyEmail(otp)} variant="primary" disabled={loading || !otp}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Button>

        <Button onClick={() => handleResendOtp()} variant="outline" disabled={loading}>
          Resend OTP
        </Button>
      </div>
    </div>
  );
}