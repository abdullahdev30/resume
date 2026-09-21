import { requireCurrentUser } from "../../modules/auth/server";
import { AppShell } from "../../modules/layout/AppShell";
import { OnboardingFlow } from "../../modules/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <OnboardingFlow user={user} />
    </AppShell>
  );
}
