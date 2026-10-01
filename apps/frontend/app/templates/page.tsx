import { requireCurrentUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import TemplatesClient from "./TemplatesClient";
import { getProfileOnServer } from "../../modules/profile/server";

export default async function TemplatesPage() {
  const [user, profile] = await Promise.all([
    requireCurrentUser(),
    getProfileOnServer(),
  ]);

  return (
    <AppShell user={user} initialProfile={profile}>
      <TemplatesClient profile={profile} />
    </AppShell>
  );
}
