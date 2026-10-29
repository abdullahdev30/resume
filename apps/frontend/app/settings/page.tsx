import { requireCurrentUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <SettingsClient user={user} />
    </AppShell>
  );
}
