import "server-only";

import { serverApi } from "@/lib/server-api";
import type { ResumeListResponse, ResumeRecord } from "./types";

export async function listResumesOnServer(): Promise<ResumeRecord[] | null> {
  try {
    return (await serverApi<ResumeListResponse>("/resumes")).resumes;
  } catch {
    return null;
  }
}

export async function getResumeOnServer(id: string): Promise<ResumeRecord | null> {
  try {
    return await serverApi<ResumeRecord>(`/resumes/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}
