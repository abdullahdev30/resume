"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface OnboardingGateProps {
  userId: string;
}

export function OnboardingGate({ userId }: OnboardingGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/dashboard") {
      return;
    }

    const completedUser = localStorage.getItem(`onboarding_completed:${userId}`);
    const skippedUser = localStorage.getItem(`onboarding_skipped:${userId}`);
    const genericState = localStorage.getItem("onboarding_state");
    const legacyUser = localStorage.getItem(`onboarding_state:${userId}`);

    const isDone =
      completedUser === "true" ||
      skippedUser === "true" ||
      genericState === "completed" ||
      genericState === "skipped" ||
      genericState === "done" ||
      legacyUser === "completed" ||
      legacyUser === "skipped";

    if (!isDone) {
      router.replace("/onboarding");
    }
  }, [pathname, router, userId]);

  return null;
}

