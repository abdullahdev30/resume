import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { PersonaDetail } from "@/modules/persona/components/PersonaDetail";

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([requireCurrentUser(), params]);
  return (
    <AppShellServer user={user}>
      <PersonaDetail key={id} id={id} />
    </AppShellServer>
  );
}
