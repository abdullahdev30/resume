import { requireCurrentUser } from "../../modules/auth/server";
import { AppShell } from "../../modules/layout/AppShell";
import { ProfileForm } from "../../modules/profile";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <ProfileForm user={user} />
    </AppShell>
  );
}
