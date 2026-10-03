import { getCurrentUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import TemplatesClient from "./TemplatesClient";
import { getProfileOnServer } from "../../modules/profile/server";

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfileOnServer() : null;

  return (
    <AppShell user={user} initialProfile={profile}>
      <TemplatesClient profile={profile} isAuthenticated={Boolean(user)} />
    </AppShell>
  );
}
