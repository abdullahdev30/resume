import { apiClient } from "@/lib/api-client";
import type {
  AIEditPayload,
  AIEditProposal,
  AIResumePayload,
  ResumeListResponse,
  ResumeRecord,
  ResumeUpdatePayload,
  TemplateResumePayload,
} from "./types";

export const resumeApi = {
  list: () => apiClient<ResumeListResponse>("/resumes"),

  get: (id: string) => apiClient<ResumeRecord>(`/resumes/${id}`),

  createTemplate: (payload: TemplateResumePayload) =>
    apiClient<ResumeRecord>("/resumes/template", {
      method: "POST",
      body: payload,
    }),

  createAI: (payload: AIResumePayload) =>
    apiClient<ResumeRecord>("/resumes/ai", {
      method: "POST",
      body: payload,
    }),

  update: (id: string, payload: ResumeUpdatePayload) =>
    apiClient<ResumeRecord>(`/resumes/${id}`, {
      method: "PUT",
      body: payload,
    }),

  aiEdit: (id: string, payload: AIEditPayload) =>
    apiClient<AIEditProposal>(`/resumes/${id}/ai-edit`, {
      method: "POST",
      body: payload,
    }),

  generatePdf: (id: string) =>
    apiClient<ResumeRecord>(`/resumes/${id}/generate-pdf`, {
      method: "POST",
    }),

  remove: (id: string) =>
    apiClient<{ message: string }>(`/resumes/${id}`, {
      method: "DELETE",
    }),
};
