import { getSessionUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import TemplatesClient from "./TemplatesClient";
import { getProfileOnServer } from "../../modules/profile/server";

export default async function TemplatesPage() {
  const sessionUser = await getSessionUser();
  const isRegistered = Boolean(sessionUser && !sessionUser.is_guest);
  const profile = isRegistered ? await getProfileOnServer() : null;

  return (
    <AppShell user={isRegistered ? sessionUser : null} initialProfile={profile}>
      <TemplatesClient profile={profile} sessionUser={sessionUser} />
    </AppShell>
  );
}
