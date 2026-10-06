"use client";

import { ResumeListClient } from "@/modules/resume/components/ResumeListClient";
import type { ResumeRecord } from "@/modules/resume/types";

export default function DashboardClient({
  initialResumes,
  initialProfileIncomplete,
  hasSession,
  isGuest,
}: {
  initialResumes?: ResumeRecord[];
  initialProfileIncomplete?: boolean;
  hasSession: boolean;
  isGuest: boolean;
}) {
  return (
    <ResumeListClient
      dashboard
      initialResumes={initialResumes}
      initialProfileIncomplete={initialProfileIncomplete}
      hasSession={hasSession}
      isGuest={isGuest}
    />
  );
}
