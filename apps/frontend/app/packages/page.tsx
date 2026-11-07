import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { PackagesClient } from "@/modules/billing/PackagesClient";

export default async function PackagesPage() {
  const user = await requireCurrentUser();
  return (
    <AppShellServer user={user}>
      <PackagesClient />
    </AppShellServer>
  );
}
