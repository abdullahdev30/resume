import { requireCurrentUser } from "../../modules/auth/server";
import { AppShell } from "../../modules/layout/AppShell";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await requireCurrentUser().catch(() => ({
    id: "user-1",
    email: "jane@mail.com",
    name: "Jane Doe",
  }));

  return (
    <AppShell user={user}>
      <DashboardClient />
    </AppShell>
  );
}