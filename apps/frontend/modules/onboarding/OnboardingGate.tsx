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

    const state =
      localStorage.getItem(`onboarding_state:${userId}`) ||
      localStorage.getItem("onboarding_state");

    if (state !== "completed" && state !== "skipped") {
      router.replace("/onboarding");
    }
  }, [pathname, router, userId]);

  return null;
}
