import { apiClient } from "@/lib/api-client";
import type {
  AIEditPayload,
  AIEditProposal,
  AIResumePayload,
  ResumePdfResponse,
  ResumeRecord,
  ResumeUpdatePayload,
  TemplateResumePayload,
} from "./types";

export const resumeApi = {
  getPdf: (id: string) =>
    apiClient<ResumePdfResponse>(`/resumes/${id}/pdf`, {
      timeoutMs: 60000,
      retry: false,
    }),
  createTemplate: (payload: TemplateResumePayload) =>
    apiClient<ResumeRecord>("/resumes/template", {
      method: "POST",
      body: payload,
      timeoutMs: 60000,
    }),

  createAI: (payload: AIResumePayload) =>
    apiClient<AIEditProposal>("/resumes/ai", {
      method: "POST",
      body: payload,
      timeoutMs: 150000,
    }),

  update: (id: string, payload: ResumeUpdatePayload) =>
    apiClient<ResumeRecord>(`/resumes/${id}`, {
      method: "PUT",
      body: payload,
      timeoutMs: 60000,
    }),

  aiEdit: (id: string, payload: AIEditPayload) =>
    apiClient<AIEditProposal>(`/resumes/${id}/ai-edit`, {
      method: "POST",
      body: payload,
      timeoutMs: 60000,
    }),

  remove: (id: string) =>
    apiClient<{ message: string }>(`/resumes/${id}`, {
      method: "DELETE",
    }),
};
