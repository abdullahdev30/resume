import { requireCurrentUser } from "../../modules/auth/server";
import { AppShell } from "../../modules/layout/AppShell";
import { ProfileSettingsForm } from "../../modules/settings/ProfileSettingsForm";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <ProfileSettingsForm user={user} />
    </AppShell>
  );
}
