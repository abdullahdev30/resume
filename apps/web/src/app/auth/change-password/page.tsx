'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { useAuth } from '../../../modules/auth/useAuth';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ new_password: '', confirm_new_password: '' });
  const [formError, setFormError] = useState('');
  const { handleChangePassword, loading, error } = useAuth();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_new_password) {
      setFormError('New passwords do not match');
      return;
    }
    setFormError('');
    handleChangePassword(form);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: '24rem', padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Set New Password</h1>

        {(formError || error) && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{formError || error}</span>}

        <Input label="New Password" type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} placeholder="••••••••" />
        <Input label="Confirm New Password" type="password" value={form.confirm_new_password} onChange={(e) => setForm({ ...form, confirm_new_password: e.target.value })} placeholder="••••••••" />

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}