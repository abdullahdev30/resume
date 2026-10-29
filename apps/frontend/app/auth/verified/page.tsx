import { redirect } from "next/navigation";

// Supabase confirmation links verify the email before returning here. Sign in
// through the backend to establish this browser's HttpOnly cookie session.
export default function VerifiedPage() {
  redirect("/auth/login");
}
