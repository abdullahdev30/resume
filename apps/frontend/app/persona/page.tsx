import { requireCurrentUser } from "@/modules/auth/server";
import { AppShellServer } from "@/modules/layout/AppShellServer";
import { PersonaGallery } from "@/modules/persona/components/PersonaGallery";

export default async function PersonaPage() {
  const user = await requireCurrentUser();
  return (
    <AppShellServer user={user}>
      <PersonaGallery />
    </AppShellServer>
  );
}
