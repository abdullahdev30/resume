'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { useAuth } from '../../../modules/auth/useAuth';

export default function VerifyRecoveryOtpPage() {
  const [otp, setOtp] = useState('');
  const { handleVerifyRecoveryOtp, loading, error } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '24rem', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Verify Recovery OTP</h1>

        {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</span>}

        <Input label="Recovery OTP" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />

        <Button onClick={() => handleVerifyRecoveryOtp(otp)} variant="primary" disabled={loading || !otp}>
          {loading ? 'Verifying...' : 'Verify Recovery OTP'}
        </Button>
      </div>
    </div>
  );
}