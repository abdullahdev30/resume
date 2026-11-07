import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { AdminClient } from "@/modules/billing/AdminClient";

export default async function AdminPage() {
  const user = await requireCurrentUser();
  return (
    <AppShellServer user={user}>
      <AdminClient />
    </AppShellServer>
  );
}
