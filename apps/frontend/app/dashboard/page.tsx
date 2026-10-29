import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import DashboardClient from "./DashboardClient";
export default async function DashboardPage() {
  const user = await requireCurrentUser();
  return (
    <AppShellServer user={user}>
      <DashboardClient />
    </AppShellServer>
  );
}
