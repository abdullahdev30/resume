"use client";

import Link from "next/link";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../hooks";
import { RegistrationFieldsForm } from "./RegistrationFieldsForm";

export function RegisterForm() {
  const { handleRegister, loading, error } = useAuth();

  return (
    <AuthLayout title="Create your account" subtitle="Start with the essentials. You can finish the resume details next.">
      <RegistrationFieldsForm
        onSubmit={handleRegister}
        loading={loading}
        error={error}
        footer={<p>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-link">
            Log in
          </Link>
        </p>}
      />
    </AuthLayout>
  );
}
