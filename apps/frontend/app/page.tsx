import { LoginForm } from "../modules/auth";
import { getCurrentUser } from "../modules/auth/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <LoginForm />;
}
