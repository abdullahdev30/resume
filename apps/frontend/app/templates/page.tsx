import { requireCurrentUser } from "../../modules/auth/server";
import { AppShellServer as AppShell } from "../../modules/layout/AppShellServer";
import TemplatesClient from "./TemplatesClient";

export default async function TemplatesPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <TemplatesClient />
    </AppShell>
  );
}
