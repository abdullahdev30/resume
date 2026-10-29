"use client";
import Link from "next/link";
import { AuthLayout } from "./AuthLayout";
import { RegistrationFieldsForm } from "./RegistrationFieldsForm";
import { useAuth } from "../hooks";
export function RegisterForm() {
  const { handleRegister, loading, error } = useAuth();
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save resumes and manage your personas."
    >
      <RegistrationFieldsForm
        onSubmit={handleRegister}
        loading={loading}
        error={error}
        submitLabel="Sign up"
        loadingLabel="Creating account..."
        footer={
          <p>
            Already have an account?{" "}
            <Link href="/auth/login" className="text-link">
              Log in
            </Link>
          </p>
        }
      />
    </AuthLayout>
  );
}
