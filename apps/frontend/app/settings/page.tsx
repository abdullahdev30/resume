import { requireCurrentUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import SettingsClient from "./SettingsClient";
import { getProfileOnServer } from "../../modules/profile/server";

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([
    requireCurrentUser(),
    getProfileOnServer(),
  ]);

  return (
    <AppShell user={user} initialProfile={profile}>
      <SettingsClient user={user} initialProfile={profile} />
    </AppShell>
  );
}
