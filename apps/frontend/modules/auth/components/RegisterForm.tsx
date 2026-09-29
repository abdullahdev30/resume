"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";

import { Alert } from "../../../components/feedback/Alert";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import { isStrongPassword, passwordsMatch } from "../schemas";
import { useAuth } from "../hooks";

export function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [formError, setFormError] = useState("");
  const { handleRegister, loading, error } = useAuth();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirm_password) {
      setFormError("Fill in every required field.");
      return;
    }
    if (!passwordsMatch(form.password, form.confirm_password)) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!isStrongPassword(form.password)) {
      setFormError("Password must meet every rule below.");
      return;
    }
    setFormError("");
    void handleRegister(form);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start with the essentials. You can finish the resume details next.">
      <form className="form-stack" onSubmit={onSubmit}>
        {(formError || error) && <Alert variant="error">{formError || error}</Alert>}
        <Input
          label="Full name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="John Doe"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="user@example.com"
        />
        <Input
          label="Phone number"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          placeholder="03001234567"
          hint="11 digits, e.g. 03001234567"
        />
        <PasswordField
          label="Password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Create a password"
          showChecklist
        />
        <PasswordField
          label="Confirm password"
          value={form.confirm_password}
          onChange={(event) => setForm({ ...form, confirm_password: event.target.value })}
          placeholder="Repeat your password"
        />
        <Button type="submit" loading={loading}>
          Sign up
        </Button>
        <p>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-link">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
