'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { useAuth } from '../../../modules/auth/useAuth';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', number: '', password: '', confirm_password: '' });
  const [formError, setFormError] = useState('');
  const { handleRegister, loading, error } = useAuth();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.number || !form.password || !form.confirm_password) {
      setFormError('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirm_password) {
      setFormError('Passwords do not match');
      return;
    }
    setFormError('');
    handleRegister(form);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: '24rem', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create an Account</h1>
        
        {(formError || error) && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{formError || error}</span>}

        <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
        <Input label="Phone Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="+123456789" />
        <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        <Input label="Confirm Password" type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} placeholder="••••••••" />

        <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
          {loading ? 'Creating...' : 'Register'}
        </Button>

        <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          Already have an account? <Link href="/auth/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </p>
      </form>
    </div>
  );
}