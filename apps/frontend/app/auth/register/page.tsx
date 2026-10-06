import { RegisterForm } from "../../../modules/auth";
import { getSessionUser } from "../../../modules/auth/server";

export default async function RegisterPage() {
  const sessionUser = await getSessionUser();
  return <RegisterForm isGuestUpgrade={Boolean(sessionUser?.is_guest)} />;
}
