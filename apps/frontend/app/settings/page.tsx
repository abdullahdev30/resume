import { requireCurrentUser } from "../../modules/auth/server";
import { AppShell } from "../../modules/layout/AppShell";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await requireCurrentUser().catch(() => ({
    id: "user-1",
    email: "jane@mail.com",
    name: "Jane Doe",
  }));

  return (
    <AppShell user={user}>
      <SettingsClient user={user} />
    </AppShell>
  );
}
