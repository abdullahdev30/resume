'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { useAuth } from '../../../modules/auth/useAuth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const { handleForgotPassword, loading, error } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '24rem', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Forgot Password</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Enter your email to receive recovery instructions.</p>

        {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</span>}

        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />

        <Button onClick={() => handleForgotPassword({ email })} variant="primary" disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send Recovery OTP'}
        </Button>
      </div>
    </div>
  );
}