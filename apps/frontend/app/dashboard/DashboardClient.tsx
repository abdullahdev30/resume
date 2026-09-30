"use client";

import { ResumeListClient } from "@/modules/resume/components/ResumeListClient";
import type { ResumeRecord } from "@/modules/resume/types";

export default function DashboardClient({
  initialResumes,
  initialProfileIncomplete,
}: {
  initialResumes?: ResumeRecord[];
  initialProfileIncomplete?: boolean;
}) {
  return <ResumeListClient dashboard initialResumes={initialResumes} initialProfileIncomplete={initialProfileIncomplete} />;
}
