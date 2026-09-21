'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { useAuth } from './useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { handleLogin, loading, error } = useAuth();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('All fields are required');
      return;
    }
    setFormError('');
    handleLogin({ email, password });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: '24rem', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--background)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Login to your account</h1>

        {(formError || error) && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{formError || error}</span>}

        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/auth/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>Forgot Password?</Link>
        </div>

        <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          Don't have an account? <Link href="/auth/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </p>
      </form>
    </div>
  );
}
