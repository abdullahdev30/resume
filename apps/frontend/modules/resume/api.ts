import { apiClient, apiClientUpload } from "@/lib/api-client";
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
      timeoutMs: 60000,
    }),

  uploadPdf: (
    file: File,
    title?: string,
    options?: { onProgress?: (percent: number) => void; signal?: AbortSignal },
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    return apiClientUpload<ResumeRecord>("/resumes", formData, options);
  },

  update: (id: string, payload: ResumeUpdatePayload) =>
    apiClient<ResumeRecord>(`/resumes/${id}`, {
      method: "PUT",
      body: payload,
    }),

  aiEdit: (id: string, payload: AIEditPayload) =>
    apiClient<AIEditProposal>(`/resumes/${id}/ai-edit`, {
      method: "POST",
      body: payload,
      timeoutMs: 60000,
    }),

  getPdf: (id: string) =>
    apiClient<{ download_url: string }>(`/resumes/${id}/pdf`),

  remove: (id: string) =>
    apiClient<{ message: string }>(`/resumes/${id}`, {
      method: "DELETE",
    }),
};
