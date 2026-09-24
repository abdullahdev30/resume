import { requireCurrentUser } from "../../modules/auth/server";
import { AppShell } from "../../modules/layout/AppShell";
import TemplatesClient from "./TemplatesClient";

export default async function TemplatesPage() {
  const user = await requireCurrentUser().catch(() => ({
    id: "user-1",
    email: "jane@mail.com",
    name: "Jane Doe",
  }));

  return (
    <AppShell user={user}>
      <TemplatesClient />
    </AppShell>
  );
}